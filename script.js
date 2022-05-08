//canvas setup
let canvas = document.getElementById("myCanvas");
let ctx = canvas.getContext("2d");

let TIME = 0.05;
let GRAVITY = 1000;
let DAMP = 0.25;
//planet options
let PLANETMASS = [2,4,8];
let PLANETRADIUS = [1,2,4];

let SUNRADIUS = 8;
let SUNMASS = 32;
//color
let currentColor = 0;
let colors = [{r:255,g:0,b:0},{r:255,g:255,b:0},{r:0,g:0,b:255},{r:255,g:0,b:255},{r:255,g:0,b:127},{r:0,g:255,b:0}];
let sizes = [1,2,4];
//0 for planet, 1 for sun;
let currentObject = 0;

//track style
let TRAIL = 20; // 10, 20, 40
let TRAILMIN = 10;
let TRAILMAX = 40;
//planet spawn style
let spawnStyle = 0; //0 for target, 1 for random, 2 for circle

let planetSize = 1; //0 for small, 1 for med, 2 for large

//object pool
let objects = [];

class Rect{
	constructor(xPos, yPos, l, w, item, desc){
		this.xPos = xPos;
		this.yPos = yPos;
		this.l = l;
		this.w = w;
		this.item = item;
		this.desc = desc;
	}
}
let menuItem = -1;
class Menu{
	constructor(){
		this.options = [
			new Rect(10, canvas.height - 90,20,60,0,'Track'),
			new Rect(10, canvas.height - 60,20,60,1,'Color'),
			new Rect(80, canvas.height - 90,20,60,2,'Target'),
			new Rect(80, canvas.height - 60,20,60,3,'Random'),
			new Rect(80, canvas.height - 30,20,60,4,'Circle'),
			new Rect(150, canvas.height - 90,20,60,5,'Size'),
			new Rect(150, canvas.height - 60,20,60,6,'Star'),
			new Rect(220, canvas.height - 90,20,60,7,'Speed'),
			new Rect(220, canvas.height - 60,20,60,8,'Restart'),
		];
	}
}
let menu = new Menu();
class Planet{
	xPos = 0;
	yPos = 0;
	xVel = 0;
	yVel = 0;
	xAcc = 0;
	yAcc = 0;
	xForce = 0;
	yForce = 0;
	
	radius = 5;
	mass = 10;
	color = colors[currentColor];
	
	prevPosition = [];
	constructor(xPos, yPos){
		this.xPos = xPos;
		this.yPos = yPos;
		if(planetSize == 0){
			this.radius = PLANETRADIUS[0];
			this.mass = PLANETMASS[0];
		}
		else if(planetSize == 1){
			this.radius = PLANETRADIUS[1];
			this.mass = PLANETMASS[1];
		}
		else{
			this.radius = PLANETRADIUS[2];
			this.mass = PLANETMASS[2];
		}
	}
}
class Sun{
	xPos = 0;
	yPos = 0;
	
	radius = SUNRADIUS;
	mass = SUNMASS;
	color = colors[1];
	constructor(xPos, yPos){
		this.xPos = xPos;
		this.yPos = yPos;
	}
}
class Collision{
	constructor(obj1, obj2, dx, dy, dist){
		this.obj1 = obj1;
		this.obj2 = obj2;
		this.dx = dx;
		this.dy = dy;
		this.dist = dist;
	}
}
class Cursor{
	constructor(xPos, yPos){
		this.xPos = xPos;
		this.yPos = yPos;
		this.radius = 1;
	}
}
let cursor = new Cursor(0,0);
let xStartPos = 0;
let yStartPos = 0;
let tempMouseX = 0;
let tempMouseY = 0;

let mousedown = false;
let menuing = false;
let circleOrbit = false;
let circleX = 0;
let circleY = 0;
canvas.addEventListener('mousedown', e =>{
	mousedown = true;
	if(menuItem >= 0){
		menuing = true;
		//item selected
		switch(menuItem){
			case 0:
				TRAIL *= 2;
				if(TRAIL > TRAILMAX){
					TRAIL = TRAILMIN;
				}
				break;
			case 1:
				currentColor++
				currentColor = currentColor % colors.length;
				break;
			case 2:
				currentObject = 0;
				spawnStyle = 0;
				break;
			case 3:
				currentObject = 0;
				spawnStyle = 1;
				break;
			case 4:
				currentObject = 0;
				spawnStyle = 2;
				break;
			case 5:
				planetSize++
				planetSize = planetSize % 3;
				break;
			case 6:
				currentObject = 1;
				break;
			case 7:
				if(TIME == 0){
					TIME = 0.0125;
				}
				else{
					TIME *= 2;
					if(TIME > 0.4){
						TIME = 0;
					}
				}
				break;
			case 8:
				resetAll();
				break;
		}
	}
	//place object;
	else if(currentObject){
		//sun
		objects.push(new Sun(e.offsetX, e.offsetY));
	}
	else{
		//planet
		if(spawnStyle == 0){
			xStartPos = e.offsetX;
			yStartPos = e.offsetY;
			tempMouseX = 0;
			tempMouseY = 0;
		}
		else if(spawnStyle == 1){
			//random
			objects.push(new Planet(e.offsetX,e.offsetY));
			objects[objects.length-1].xVel = Math.floor(Math.random() * 50);
			objects[objects.length-1].yVel = Math.floor(Math.random() * 50);
		}
		else{
			//circle
			circleOrbit = true;
			circleX = e.offsetX;
			circleY = e.offsetY;
		}
	}
});
canvas.addEventListener('mouseup', e =>{
	mousedown = false;
	//release object;
	if(menuing){
		menuing = false;
	}
	else if(currentObject){
		//sun, doesnt do anything
	}
	else{
		//planet release
		if(spawnStyle == 0){
			objects.push(new Planet(xStartPos,yStartPos));
			objects[objects.length-1].xVel = (xStartPos - e.offsetX) * DAMP;
			objects[objects.length-1].yVel = (yStartPos - e.offsetY) * DAMP;
		}
	}
});
function solveCircle(){
	circleOrbit = false;
	let newPlanet = new Planet(circleX,circleY);
	let planetMass = newPlanet.mass;
	
	let dx = circleX - (canvas.width/2);
	let dy = circleY - ((canvas.height - 100)/2);
	let r = Math.sqrt(Math.pow(dx,2)+Math.pow(dy,2));
	if(r<1){
		r=1;
	}

	let v = 1;
	if(planetSize == 0){
		v = Math.sqrt((GRAVITY*SUNMASS*planetMass)/r)*1.39;
	}
	else if(planetSize == 1){
		v = Math.sqrt((GRAVITY*SUNMASS*planetMass)/r)*2;
	}
	else{
		v = v = Math.sqrt((GRAVITY*SUNMASS*planetMass)/r)*2.8;
	}
	
	let phi = Math.atan2(dy,dx);
	
	let vx = v * Math.cos(phi + (Math.PI/2));
	let vy = v * Math.sin(phi + (Math.PI/2));
	
	newPlanet.xVel += vx/planetMass;
	newPlanet.yVel += vy/planetMass;
	
	objects.push(newPlanet);
	console.log('not implemented yet ;)');
}
canvas.addEventListener('mousemove', e =>{
	cursor.xPos = e.offsetX;
	cursor.yPos = e.offsetY;
	tempMouseX = (e.offsetX - xStartPos) * DAMP;
	tempMouseY = (e.offsetY - yStartPos) * DAMP;
});
function init(){
	objects.push(new Sun(canvas.width/2,((canvas.height-100)/2)));
	frame();
}
function resetAll(){
	while(objects.length != 0){
		objects.pop();
	}
	TRAIL = 20;
	currentColor = 0;
	spawnStyle = 0;
	planetSize = 1;
	TIME = 0.05;
	objects.push(new Sun(canvas.width/2,((canvas.height - 100)/2)));
}
function frame(){
	//calculate circular orbit
	if(circleOrbit){
		solveCircle();
	}
	moveObjects();
	for(let i=0;i<objects.length;i++){
		for(let j=0;j<objects.length;j++){
			if(i<j){
				resolveCollision(checkCollision(objects[i],objects[j]));
			}
		}
	}
	//menu highlight
	menuItem = -1;
	for(let i=0;i<menu.options.length;i++){
		resolveCollision(checkCollision(cursor,menu.options[i]));
	}
	draw();
	window.requestAnimationFrame(frame);
}
function resolveCollision(coll){
	if(coll.coll){
		//both are planets
		if(coll.collInfo.obj1 instanceof Planet && coll.collInfo.obj2 instanceof Planet){
			if(coll.collInfo.obj1.mass > coll.collInfo.obj2.mass){
				//obj2 explodes
				for(let i=0;i<objects.length;i++){
					if(objects[i] == coll.collInfo.obj2){
						objects.splice(i,1);
						breakPlanet(coll.collInfo.obj2);
						break;
					}
				}
			}
			else if(coll.collInfo.obj1.mass < coll.collInfo.obj2.mass){
				//obj1
				for(let i=0;i<objects.length;i++){
					if(objects[i] == coll.collInfo.obj1){
						objects.splice(i,1);
						breakPlanet(coll.collInfo.obj1);
						break;
					}
				}
			}
			else{
				//both explode
				if(coll.collInfo.obj2.radius == 1 && coll.collInfo.obj1.radius == 1){
					//smallest size doesnt destroy
					let nx = coll.collInfo.dx / coll.collInfo.dist;
					let ny = coll.collInfo.dy / coll.collInfo.dist;
					let s = coll.collInfo.obj2.radius + coll.collInfo.obj1.radius - coll.collInfo.dist;
					
					let k = -2 * ((coll.collInfo.obj2.xVel - coll.collInfo.obj1.xVel) * nx + (coll.collInfo.obj2.yVel - coll.collInfo.obj1.yVel) * ny) / (1/coll.collInfo.obj1.mass + 1/coll.collInfo.obj2.mass);
					
					for(let i=0;i<objects.length;i++){
						if(objects[i] == coll.collInfo.obj2){
							objects[i].xPos += nx * s/2;
							objects[i].yPos += ny * s/2;
							objects[i].xVel += ((k * nx) / objects[i].mass)*TIME*0.25;
							objects[i].yVel += ((k * ny) / objects[i].mass)*TIME*0.25;
						}
						else if(objects[i] == coll.collInfo.obj1){
							objects[i].xPos -= nx * s/2;
							objects[i].yPos -= ny * s/2;
							objects[i].xVel -= ((k * nx) / objects[i].mass)*TIME*0.25;
							objects[i].yVel -= ((k * ny) / objects[i].mass)*TIME*0.25;
						}
					}
				}
				else{
					for(let i=0;i<objects.length;i++){
						if(objects[i] == coll.collInfo.obj2){
							objects.splice(i,1);
							breakPlanet(coll.collInfo.obj2);
							i--;
						}
						if(objects[i] == coll.collInfo.obj1){
							objects.splice(i,1);
							breakPlanet(coll.collInfo.obj1);
							i--;
						}
					}
				}
			}
		}
		//planet and sun
		if(coll.collInfo.obj1 instanceof Planet && coll.collInfo.obj2 instanceof Sun){
			//planet dies horrific death
			for(let i=0;i<objects.length;i++){
				if(objects[i] == coll.collInfo.obj1){
					objects.splice(i,1);
					break;
				}
			}
		}
		else if(coll.collInfo.obj1 instanceof Sun && coll.collInfo.obj2 instanceof Planet){
			//planet dies horrific death
			for(let i=0;i<objects.length;i++){
				if(objects[i] == coll.collInfo.obj2){
					objects.splice(i,1);
					break;
				}
			}
		}
		//sun and sun (meaning sun was clicked)
		if(coll.collInfo.obj1 instanceof Sun && coll.collInfo.obj2 instanceof Sun){
			//remove both suns
			for(let i=0;i<objects.length;i++){
				if(objects[i] == coll.collInfo.obj1 || objects[i] == coll.collInfo.obj2){
					objects.splice(i,1);
					i--;
				}
			}
		}
	}
}
function breakPlanet(obj){
	let randomRocks = obj.radius - 1;
	for(let j=0;j<randomRocks;j++){
		let planetFrag = new Planet(obj.xPos + Math.floor(Math.random()*5),obj.yPos + Math.floor(Math.random()*5));
		planetFrag.xVel = (Math.random()*obj.xVel);
		planetFrag.yVel = (Math.random()*obj.yVel);
		planetFrag.radius = 1;
		planetFrag.mass = 2;
		planetFrag.color = obj.color;
		objects.push(planetFrag);
	}
}
function checkCollision(obj1, obj2){
	if(obj1 instanceof Cursor){
		if( obj1.xPos < obj2.xPos + obj2.w &&
			obj1.xPos + obj1.radius > obj2.xPos &&
			obj1.yPos < obj2.yPos + obj2.l &&
			obj1.radius + obj1.yPos > obj2.yPos){
			//cursor on menu item
			menuItem = obj2.item;
		}
	}
	let dx = obj2.xPos - obj1.xPos;
	let dy = obj2.yPos - obj1.yPos;
	let d = Math.sqrt(Math.pow(dx,2)+Math.pow(dy,2));
	if(d < 1){
		d = 1;
	}
	if(d < obj1.radius + obj2.radius){
		return {
			collInfo: new Collision(obj1, obj2, dx, dy, d),
			coll: true
		}
	}
	return {
		collInfo: null,
		coll: false
	}
}
function moveObjects(){
	for(let i=0;i<objects.length;i++){
		if(objects[i] instanceof Planet){
			objects[i].xForce = 0;
			objects[i].yForce = 0;
		}
	}
	for(let i=0;i<objects.length;i++){
		for(let j=0;j<objects.length;j++){
			if(i < j){
				if(objects[i].radius == 1 && objects[j].radius == 1){
					//smallest size doesnt interact with eachother to avoid craziness 
				}
				else{
					let dx = objects[j].xPos - objects[i].xPos;
					let dy = objects[j].yPos - objects[i].yPos;
					let r = Math.sqrt(Math.pow(dx,2)+Math.pow(dy,2));
					if(r<1){
						r=1;
					}

					let f = (GRAVITY * objects[i].mass * objects[j].mass) / Math.pow(r,2);
					let fx = f * dx / r;
					let fy = f * dy / r;
					
					//check that the object being forced upon is smaller than the target
					if(objects[i] instanceof Planet && objects[i].mass <= objects[j].mass){
						objects[i].xForce += fx;
						objects[i].yForce += fy;
					}
					if(objects[j] instanceof Planet && objects[j].mass <= objects[i].mass){
						objects[j].xForce -= fx;
						objects[j].yForce -= fy;
					}
				}
			}
		}
	}
	for(let i=0;i<objects.length;i++){
		if(objects[i] instanceof Planet){
			objects[i].prevPosition.push({'xPos':objects[i].xPos,'yPos':objects[i].yPos});
			while(objects[i].prevPosition.length > TRAIL){
				objects[i].prevPosition.shift();
			}
			objects[i].xAcc = objects[i].xForce / objects[i].mass;
			objects[i].yAcc = objects[i].yForce / objects[i].mass;
			objects[i].xVel += objects[i].xAcc * TIME;
			objects[i].yVel += objects[i].yAcc * TIME;
			objects[i].xPos += objects[i].xVel * TIME;
			objects[i].yPos += objects[i].yVel * TIME;
			
			if(Math.abs(objects[i].xPos) > Math.abs(canvas.width + 100) || isNaN(objects[i].xPos)){
				objects.splice(i,1);
			}
			else if(Math.abs(objects[i].yPos) > Math.abs(canvas.width + 100) || isNaN(objects[i].xPos)){
				objects.splice(i,1);
			}
		}
	}
}
function draw(){
	ctx.fillStyle = 'black';
	ctx.fillRect(0,0,canvas.width,canvas.height);
	for(let i=0;i<objects.length;i++){
		//draw objects
		if(objects[i] instanceof Planet){
			for(let j=0;j<objects[i].prevPosition.length;j++){
				ctx.beginPath();
				ctx.fillStyle = `rgba(${objects[i].color.r},${objects[i].color.g},${objects[i].color.b},0.25)`;
				ctx.arc(objects[i].prevPosition[j].xPos, objects[i].prevPosition[j].yPos, 1, 0, 2*Math.PI, false);
				ctx.fill();
			}
		}
		ctx.fillStyle = `rgba(${objects[i].color.r},${objects[i].color.g},${objects[i].color.b},1)`;
		ctx.beginPath();
		ctx.arc(objects[i].xPos, objects[i].yPos, objects[i].radius, 0, 2*Math.PI, false);
		ctx.fill();
	}
	if(mousedown && !menuing && currentObject == 0 && spawnStyle == 0){
		//draw to be planet
		ctx.fillStyle = `rgba(${colors[currentColor].r},${colors[currentColor].g},${colors[currentColor].b},1)`;
		ctx.beginPath();
		ctx.arc(xStartPos, yStartPos, sizes[planetSize], 0, 2*Math.PI, false);
		ctx.fill();
		//draw velocity line
		ctx.strokeStyle = 'red';
		ctx.beginPath();
		ctx.moveTo(xStartPos, yStartPos);
		ctx.lineTo(xStartPos - tempMouseX, yStartPos - tempMouseY);
		ctx.stroke();
	}
	//draw menu stuff
	ctx.strokeStyle = `rgb(255,255,255)`;
	ctx.beginPath();
	ctx.moveTo(0, canvas.height - 100);
	ctx.lineTo(canvas.width, canvas.height - 100);
	ctx.stroke();
	//draw buttons
	for(let i=0;i<menu.options.length;i++){
		ctx.fillStyle = 'rgb(180,180,180)';
		ctx.fillRect(menu.options[i].xPos,menu.options[i].yPos,menu.options[i].w,menu.options[i].l);
		ctx.fillStyle = 'rgb(10,10,10)';
		ctx.font = "14px Arial";
		ctx.fillText(menu.options[i].desc,menu.options[i].xPos+3, menu.options[i].yPos + 15);
		if(menu.options[i].item == menuItem){
			ctx.strokeStyle = 'rgb(255,0,0)';
			ctx.strokeRect(menu.options[i].xPos,menu.options[i].yPos,menu.options[i].w,menu.options[i].l);
		}
	}
	//stats on side
	ctx.fillStyle = 'rgb(180,180,180)';
	ctx.fillRect(290, canvas.height-90, 200, 80);
	ctx.fillStyle = 'rgb(10,10,10)';
	ctx.font = "12px Arial";
	ctx.fillText(`Track = ${TRAIL}`,290+3,canvas.height-75);
	ctx.fillText(`Color = rgb(${colors[currentColor].r},${colors[currentColor].g},${colors[currentColor].b})`,290+3,canvas.height-60);
	ctx.fillText(`Spawn Style = ${spawnStyle}`,290+3,canvas.height-45);
	ctx.fillText(`Size = ${planetSize}`,290+3,canvas.height-30);
	ctx.fillText(`Speed = ${TIME}`,290+50,canvas.height-30);
	ctx.fillText(`Spawn Type = ${currentObject}`,290+3,canvas.height-15);
}