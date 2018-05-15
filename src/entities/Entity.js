import * as THREE from 'three';
import { defaults, sample } from 'lodash';

import Animation from '../utils/Animation';
import Debug from '../Debug';

export default class Entity extends THREE.Group {
	static config = {
		animations: {},
	}

	constructor(game, map, definition, config = {}) {
		super();

		this.game = game;
		this.map = map;
		this.definition = definition;
		this.config = defaults(config, Entity.config);
		this.animation = new Animation([definition.gid], false);

		this.tilewidth = this.map.definition.tilewidth;
		this.tileheight = this.map.definition.tileheight;

		this.tile = this.map.tileset.createTile(definition.gid);
		const x = definition.x / this.tilewidth + 0.5;
		const y = definition.y / this.tileheight - 0.5;

		const color = this.map.lights.getColor(Math.floor(x), Math.floor(y));
		this.color = `#${color.getHexString()}`;
		const folder = Debug.addFolder(`${this.definition.type} - (${this.id})`);
		folder.addColor(this, 'color').listen();
		folder.add(this.position, 'x').step(0.1).listen();
		folder.add(this.position, 'z').step(0.1).listen();
		folder.add(this, 'log');

		this.tile.geometry.faces.forEach(face => face.color = color);
		this.tile.scale.set(definition.width / this.tilewidth, definition.height / this.tileheight, 1);

		this.position.set(x, definition.height / this.tileheight / 2, y);
		this.add(this.tile);
	}

	log = () => console.log(this);

	update(delta, elapsed) {
		this.updateAnimation(delta, elapsed);
		this.updateBillboard(delta, elapsed);
		this.updateColor(delta, elapsed);
	}

	updateAnimation(delta, elapsed) {
		this.animation.update(delta, elapsed);
		this.map.tileset.updateTile(this.tile, this.animation.frame);
	}

	updateBillboard(delta, elapsed) {
		const camera = this.game.camera;

		const look = new THREE.Vector3(0, camera.position.y, 0);
		look.y -= this.position.y;
		look.sub(camera.position).multiplyScalar(-1);
		this.lookAt(look);

		if (this.definition.properties.fixed === 'vertical') {
			this.rotation.y = 0;
		}
		else if (this.definition.properties.fixed === 'horizontal') {
			this.rotation.y = camera.position.x > this.position.x ? Math.PI / 2 : Math.PI / -2;
		}
	}

	updateColor(delta, elapsed) {
		const color = this.map.lights.getColor(Math.floor(this.position.x), Math.floor(this.position.z));
		this.color = `#${color.getHexString()}`;
		this.tile.geometry.faces.forEach(face => face.color = color);
		this.tile.geometry.colorsNeedUpdate = true;
		this.tile.geometry.elementsNeedUpdate = true;
	}
}