//canvas setup
let canvas = document.getElementById("myCanvas");
let ctx = canvas.getContext("2d");

let TIME = 0.1;
let GRAVITY = 1000;

//color
let currentColor = 0;
let colors = ['rgb(255,0,0)','rgb(255,255,0)','rgb(0,0,255)','rgb(255,0,255)','rgb(255,127,0)','rgb(0,255,0)'];

//0 for planet, 1 for sun;
let currentObject = 0;

//track style
let TRAIL = 20; // 10, 20, 40

//planet spawn style
let spawnStyle = 0; //0 for target, 1 for random, 2 for circle

let planetSize = 1; //0 for small, 1 for med, 2 for large

//object pool
let objects = [];

/*
colors: red, yellow, blue, purple, orange, green

color and tracking      planet opts  
Color: color options	target     size s,m,l	 speed 0 1/4 1/2 1 2 4 8
Track: s, m, l			random	   star			 restart
						circle
*/
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
		/*
		0: track
		1: color
		2: target
		3: random
		4: circle
		5: size
		6: star
		7: speed
		8: restart
		*/
		//x pos, y pos, l, w
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
/*
small:
	radius 2
	mass 5
med:
	radius 5
	mass 10
large:
	radius 8
	mass 15
*/
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
			this.radius = 2;
			this.mass = 5;
		}
		else if(planetSize == 1){
			this.radius = 5;
			this.mass = 10;
		}
		else{
			this.radius = 8;
			this.mass = 15;
		}
	}
}
class Sun{
	xPos = 0;
	yPos = 0;
	
	radius = 10;
	mass = 100;
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
canvas.addEventListener('mousedown', e =>{
	mousedown = true;
	if(menuItem >= 0){
		menuing = true;
		//item selected
		switch(menuItem){
			case 0:
				TRAIL *= 2;
				if(TRAIL > 40){
					TRAIL = 10;
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
				//0.1 is normal
				//0 stop time
				// 1/4	0.025
				// 1/2	0.05
				// 1	0.1
				// 2	0.2
				// 4	0.4
				// 8	0.8
				if(TIME == 0){
					TIME = 0.025;
				}
				else{
					TIME *= 2;
					if(TIME > 0.8){
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
			let dx = e.offsetX - canvas.width/2;
			let dy = e.offsetY - (canvas.height/2) - 50;
			let r = Math.sqrt(Math.pow(dx,2)+Math.pow(dy,2));
			if(r<1){
				r=1;
			}
			let v = Math.sqrt((GRAVITY * 100) / r);
			
			let acc = Math.pow(v,2)/r
			
			objects.push(new Planet(e.offsetX,e.offsetY));
			objects[objects.length-1].xVel += acc;
			objects[objects.length-1].yVel += acc;
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
			objects[objects.length-1].xVel = xStartPos - e.offsetX;
			objects[objects.length-1].yVel = yStartPos - e.offsetY;
		}
	}
});
canvas.addEventListener('mousemove', e =>{
	cursor.xPos = e.offsetX;
	cursor.yPos = e.offsetY;
	tempMouseX = e.offsetX - xStartPos;
	tempMouseY = e.offsetY - yStartPos;
});
function init(){
	objects.push(new Sun(canvas.width/2,(canvas.height/2) - 50));
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
	TIME = 0.1;
	objects.push(new Sun(canvas.width/2,(canvas.height/2) - 50));
}
function frame(){
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
				let dx = objects[j].xPos - objects[i].xPos;
				let dy = objects[j].yPos - objects[i].yPos;
				let r = Math.sqrt(Math.pow(dx,2)+Math.pow(dy,2));
				if(r<1){
					r=1;
				}
				let f = (GRAVITY * objects[i].mass * objects[j].mass) / Math.pow(r,2);
				let fx = f * dx / r;
				let fy = f * dy / r;
				
				if(objects[i] instanceof Planet){
					objects[i].xForce += fx;
					objects[i].yForce += fy;
				}
				if(objects[j] instanceof Planet){
					objects[j].xForce -= fx;
					objects[j].yForce -= fy;
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
			
			if(Math.abs(objects[i].xPos) > Math.abs(canvas.width + 100)){
				objects.splice(i,1);
			}
			else if(Math.abs(objects[i].yPos) > Math.abs(canvas.width + 100)){
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
		ctx.fillStyle = objects[i].color;
		if(objects[i] instanceof Planet){
			for(let j=0;j<objects[i].prevPosition.length;j++){
				ctx.beginPath();
				ctx.arc(objects[i].prevPosition[j].xPos, objects[i].prevPosition[j].yPos, 1, 0, 2*Math.PI, false);
				ctx.fill();
			}
		}
		ctx.beginPath();
		ctx.arc(objects[i].xPos, objects[i].yPos, objects[i].radius, 0, 2*Math.PI, false);
		ctx.fill();
	}
	if(mousedown && !menuing && currentObject == 0 && spawnStyle == 0){
		//draw to be planet
		ctx.fillStyle = colors[currentColor];
		ctx.beginPath();
		ctx.arc(xStartPos, yStartPos, 5, 0, 2*Math.PI, false);
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
	ctx.fillText(`Color = ${colors[currentColor]}`,290+3,canvas.height-60);
	ctx.fillText(`Spawn Style = ${spawnStyle}`,290+3,canvas.height-45);
	ctx.fillText(`Size = ${planetSize}`,290+3,canvas.height-30);
	ctx.fillText(`Speed = ${TIME}`,290+50,canvas.height-30);
	ctx.fillText(`Spawn Type = ${currentObject}`,290+3,canvas.height-15);
}