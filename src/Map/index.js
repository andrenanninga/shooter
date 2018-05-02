import * as THREE from 'three';
import { sortBy } from 'lodash';

import Tileset from './Tileset';
import Billboards from './Billboards';
import Lights from './Lights';
import Collision from './Collision';
import Ceiling from './Ceiling';
import Floor from './Floor';
import Wall from './Wall';

export default class Map extends THREE.Group {
	constructor(game, definition) {
		super();

		this.game = game;
		this.definition = this.preprocess(definition);

		this.tileset = new Tileset(game, definition.tilesets);
		this.queue = [];
		this.bodies = [];

		// Ensure that metadata layers (lights, collision) are processed first
		const layers = sortBy(this.definition.layers, (layer) => {
			const index = ['collision', 'lights'].indexOf(layer.name);
			return index > -1 ? index : Number.MAX_VALUE;
		});

		layers.forEach((layer) => {
			if (layer.name === 'lights') {
				this.lights = new Lights(game, this, layer);
			}

			if (layer.name === 'collision') {
				layer.chunks.forEach(chunk => {
					this.queue.push(() => this.add(new Collision(game, this, chunk)));
				});
			}

			if (layer.name === 'ceiling') {
				layer.chunks.forEach(chunk => {
					this.queue.push(() => this.add(new Ceiling(game, this, chunk)));
				});
			}

			if (layer.name === 'wall') {
				layer.chunks.forEach(chunk => {
					this.queue.push(() => this.add(new Wall(game, this, chunk)));
				})
			}

			if (layer.name === 'floor') {
				layer.chunks.forEach(chunk => {
					this.queue.push(() => this.add(new Floor(game, this, chunk)));
				});
			}

			if (layer.name === 'billboards') {
				this.billboards = new Billboards(game, this, layer);
				this.add(this.billboards);
			}
		});
	}

	update(delta, elapsed) {
		if (this.queue.length > 0) {
			const task = this.queue.pop();
			task();
		}

		this.billboards.update(delta, elapsed);
	}

	preprocess(definition) {

		definition.layers.forEach(layer => {
			if (layer.type === 'objectgroup') {

				layer.objects.forEach(object => {
					const properties = {};
					// object.x += definition.tilewidth / 2;

					if (object.properties) {
						object.properties.forEach(property => {
							properties[property.name] = property.value;
						});
					}

					object.properties = properties;
				});
			}
		});

		return definition;
	}
}
