/* Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php */
/*
The MIT License (MIT)

Copyright (c) 2011 SRI International

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var hemi = (function(hemi) {

	hemi.ClientBase = function() {
		this.bgColor = 0;
		this.bgAlpha = 1;
		this.camera = new hemi.Camera();
		this.scene = new hemi.Scene();
		this.picker = new hemi.Picker(this.scene, this.camera);
		this.renderer = null;
		this.projector = new THREE.Projector();

		this.useCameraLight(true);
		this.scene.add(this.camera.threeCamera);
		hemi.clients.push(this);
	};

	hemi.ClientBase.prototype = {
		addGrid: function() {
			var line_material = new THREE.LineBasicMaterial( { color: 0xcccccc, opacity: 0.2 } ),
				geometry = new THREE.Geometry(),
				floor = -0.04, step = 1, size = 14;

			for ( var i = 0; i <= size / step * 2; i ++ ) {

				geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( - size, floor, i * step - size ) ) );
				geometry.vertices.push( new THREE.Vertex( new THREE.Vector3(   size, floor, i * step - size ) ) );

				geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( i * step - size, floor, -size ) ) );
				geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( i * step - size, floor,  size ) ) );

			}

			var line = new THREE.Line( geometry, line_material, THREE.LinePieces );
			this.scene.add(line);
		},

		onRender: function() {
			this.renderer.render(this.scene, this.camera.threeCamera);
		},

		resize: function() {
			var dom = this.renderer.domElement,
				width = Math.max(1, dom.clientWidth),
				height = Math.max(1, dom.clientHeight);

			this.renderer.setSize(width, height);
			this.camera.threeCamera.aspect = width / height;
			this.camera.threeCamera.updateProjectionMatrix();
			this.picker.resize(width, height);
		},

		setBGColor: function(hex, opt_alpha) {
			this.bgColor = hex;
			this.bgAlpha = opt_alpha == null ? 1 : opt_alpha;
			this.renderer.setClearColorHex(this.bgColor, this.bgAlpha);
		},

		setCamera: function(camera) {
			this.scene.remove(this.camera.threeCamera);
			this.scene.remove(this.camera.light);
			this.scene.add(camera.threeCamera);
			this.scene.add(camera.light);
			this.camera.cleanup();
			this.picker.camera = camera;
			this.camera = camera;
		},

		setRenderer: function(renderer) {
			var dom = renderer.domElement;
			dom.style.width = "100%";
			dom.style.height = "100%";
			hemi.input.init(dom);

			renderer.setClearColorHex(this.bgColor, this.bgAlpha);
			this.renderer = renderer;
			this.resize();
		},

		setScene: function(scene) {
			this.scene.remove(this.camera.threeCamera);
			this.scene.remove(this.camera.light);
			scene.add(this.camera.threeCamera);
			scene.add(this.camera.light);
			this.scene.cleanup();
			this.picker.scene = scene;
			this.scene = scene;
		},

		useCameraLight: function(useLight) {
			if (useLight) {
				this.scene.add(this.camera.light);
			} else {
				this.scene.remove(this.camera.light);
			}
		},

		clientPositionToRay: function(clientX, clientY) {
			var dom = this.renderer.domElement;
			var x = (clientX / dom.clientWidth) * 2 - 1;
			var y = -(clientY / dom.clientHeight) * 2 + 1;
			var projVector = new THREE.Vector3(x, y, 0.5);

			this.projector.unprojectVector(projVector, this.camera.threeCamera);
			return new THREE.Ray(this.camera.threeCamera.position, projVector.subSelf(this.camera.threeCamera.position).normalize());
		},

		getWidth: function() {
			return this.renderer.domElement.clientWidth;
		},

		getHeight: function() {
			return this.renderer.domElement.clientHeight;
		}
	};

	hemi.makeCitizen(hemi.ClientBase, 'hemi.Client', {
		msgs: [],
		toOctane: function() {
			return [
				{
					name: 'bgColor',
					val: this.bgColor
				}, {
					name: 'bgAlpha',
					val: this.bgAlpha
				}, {
					name: 'setScene',
					arg: [hemi.dispatch.ID_ARG + this.scene._getId()]
				}, {
					name: 'setCamera',
					arg: [hemi.dispatch.ID_ARG + this.camera._getId()]
				}
			];
		}
	});

	return hemi;
})(hemi || {});