import * as THREE from 'three';
// Constants
import { Names, Colors, DESIGN, OBJECTS, Textures } from '@/utils/constants';

// Types
import type { ISelf } from '@/models/modules';
import type { TMountain } from '@/models/utils';
import type { HemisphereLight, Mesh, Group, GridHelper } from 'three';

// Modules
import { Module } from '@/models/modules';

// Utils
import {
  plusOrMinus,
  distance2D,
  randomInteger,
  getUniqueRandomPosition,
  getGridKey,
  isNotStartPlates,
} from '@/utils/utilities';
import { TPosition, TStone } from '@/models/utils';
import { TObject } from '@/models/store';

export default class Atmosphere extends Module {
  private _light: HemisphereLight;
  private _sand!: Mesh;
  private _grid!: GridHelper;
  private _mesh!: Mesh;
  private _randomX!: number;
  private _randomZ!: number;
  private _diff!: number;
  private _height!: number;
  private _position!: TPosition;
  private _p!: TPosition;
  private _positions!: Array<TPosition>;
  private _meshes: Group = new THREE.Group();
  private _x!: number;
  private _z!: number;
  private _cells!: { [key: string]: Array<string> };
  private _object!: TMountain;
  private _objects!: Array<TObject>;
  private _hole!: number;

  constructor() {
    super(Names.atmosphere);

    this._light = new THREE.HemisphereLight(0x6699ff, 0x295826, 1);
  }

  init(self: ISelf): void {
    // Lights

    // Hemisphere
    this._light.position.set(0, DESIGN.SIZE * 2, 0).normalize();
    self.scene.add(this._light);

    // Ambient
    self.scene.add(new THREE.AmbientLight(Colors.white));

    // Sand

    // Форма
    self.helper.geometry = new THREE.PlaneBufferGeometry(
      OBJECTS.sand.radius * 10,
      OBJECTS.sand.radius * 10,
      OBJECTS.sand.radius / 10,
      OBJECTS.sand.radius / 10,
    );

    // Текстура и материал
    self.helper.map = self.assets.getTexture(Names.sand);
    self.helper.material = new THREE.MeshStandardMaterial({
      color: Colors.yellowLight,
      map: self.helper.map,
    });

    // Искажение
    const vertex = new THREE.Vector3();
    const { position } = self.helper.geometry.attributes;
    for (let i = 0, l = position.count; i < l; i++) {
      vertex.fromBufferAttribute(position, i);

      if (
        distance2D(0, 0, vertex.x, vertex.y) > OBJECTS.sand.radius / 2 &&
        distance2D(0, 0, vertex.x, vertex.y) < OBJECTS.sand.radius * 3
      ) {
        vertex.x += (Math.random() * plusOrMinus() * DESIGN.CELL) / 10;
        vertex.y += (Math.random() * plusOrMinus() * DESIGN.CELL) / 10;
        vertex.z += (Math.random() * plusOrMinus() * DESIGN.CELL) / 10;
        vertex.z *= Math.random() * 33;
      }

      position.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    this._sand = new THREE.Mesh(self.helper.geometry, self.helper.material);
    this._sand.rotation.x = -Math.PI / 2;
    this._sand.position.set(0, OBJECTS.sand.positionY, 0);
    this._sand.name = Names.sand;
    this._sand.updateMatrix();
    self.scene.add(this._sand);

    // Stones

    // Mатериал
    self.helper.map = self.assets.getTexture(Textures.concrette);
    self.helper.material = new THREE.MeshStandardMaterial({
      color: Colors.stone,
      map: self.helper.map,
    });

    this._positions = [];
    if (self.store.getters['objects/isStart']) {
      this._objects = [];

      for (let n = 0; n < 10; ++n) {
        this._meshes = new THREE.Group();

        this._position = getUniqueRandomPosition(
          this._positions,
          0,
          0,
          5,
          DESIGN.SIZE / DESIGN.CELL / 15,
          false,
        );
        this._positions.push(this._position);

        this._randomX = randomInteger(5, 7);
        this._randomZ = randomInteger(5, 7);
        this._height = 1;
        let x = 0;
        let z = 0;
        this._object = [];

        while (x < this._randomX) {
          x += 1;

          z = 0;
          this._diff = randomInteger(-1, 1);
          while (z < this._randomZ) {
            z += 1;

            if (x === 1 || x === this._randomX)
              this._hole = randomInteger(0, 1);
            else this._hole = 0;

            this._x = this._position.x + x;
            this._z = this._position.z + z + this._diff + this._hole;
            this._p = { x: this._x, z: this._z };

            this._cells = JSON.parse(
              JSON.stringify(self.store.getters['objects/grid']),
            );

            // Добавляем в сетку если на клетке уже нет камня и это не стартовые клетки
            if (
              !(
                Object.prototype.hasOwnProperty.call(
                  this._cells,
                  getGridKey(this._p),
                ) && this._cells[getGridKey(this._p)].includes(Names.stones)
              ) &&
              isNotStartPlates({ x: this._x, z: this._z })
            ) {
              if (
                Object.prototype.hasOwnProperty.call(
                  this._cells,
                  getGridKey(this._p),
                )
              )
                this._cells[getGridKey(this._p)].push(Names.stones);
              else this._cells[getGridKey(this._p)] = [Names.stones];

              self.store.dispatch('objects/setField', {
                field: 'grid',
                value: {
                  name: Names.stones,
                  position: this._p,
                },
              });

              this._height += randomInteger(-2, 2);
              if (this._height < 1) this._height = 1;

              self.helper.geometry = new THREE.BoxBufferGeometry(
                DESIGN.CELL,
                DESIGN.CELL * this._height,
                DESIGN.CELL,
              );

              this._mesh = new THREE.Mesh(
                self.helper.geometry,
                self.helper.material,
              );
              this._mesh.position.set(
                this._x * DESIGN.CELL,
                OBJECTS.sand.positionY,
                this._z * DESIGN.CELL,
              );

              this._object.push({
                x: this._x,
                z: this._z,
                h: this._height,
              });

              this._meshes.add(this._mesh);
            }
          }
        }
        this._objects.push({
          name: Names.stones,
          id: '',
          data: this._object,
        });

        self.scene.add(this._meshes);
      }

      self.store.dispatch('objects/saveObjects', {
        name: Names.stones,
        objects: this._objects,
      });
    } else {
      this._objects = [...self.store.getters['objects/objects'][Names.stones]];

      this._objects.forEach((mountain) => {
        this._meshes = new THREE.Group();

        mountain.data.forEach((stone: TStone) => {
          this._position = { x: stone.x, z: stone.z };
          this._height = stone.h;

          self.helper.geometry = new THREE.BoxBufferGeometry(
            DESIGN.CELL,
            DESIGN.CELL * this._height,
            DESIGN.CELL,
          );

          this._mesh = new THREE.Mesh(
            self.helper.geometry,
            self.helper.material,
          );
          this._mesh.position.set(
            this._position.x * DESIGN.CELL,
            OBJECTS.sand.positionY,
            this._position.z * DESIGN.CELL,
          );

          this._meshes.add(this._mesh);
        });
        self.scene.add(this._meshes);
      });
    }

    // Sands

    if (self.store.getters['objects/isStart']) {
      this._objects = [];

      for (let n = 0; n < 10; ++n) {
        this._meshes = new THREE.Group();

        if (n === 0) {
          this._position = { x: -7, z: -7 };
          this._randomX = 15;
          this._randomZ = 15;
        } else {
          this._position = getUniqueRandomPosition(
            this._positions,
            0,
            0,
            10,
            DESIGN.SIZE / DESIGN.CELL / 10,
            false,
          );
          this._randomX = randomInteger(8, 11);
          this._randomZ = randomInteger(8, 11);
        }
        this._positions.push(this._position);

        this._height = 1;
        let x = 0;
        let z = 0;
        this._object = [];

        while (x < this._randomX) {
          x += 1;

          z = 0;
          this._diff = randomInteger(-1, 1);
          while (z < this._randomZ) {
            z += 1;

            if (x === 1 || x === this._randomX)
              this._hole = randomInteger(0, 1);
            else this._hole = 0;

            this._x = this._position.x + x;
            this._z = this._position.z + z + this._diff + this._hole;
            this._p = { x: this._x, z: this._z };

            this._cells = JSON.parse(
              JSON.stringify(self.store.getters['objects/grid']),
            );

            // Добавляем в сетку если на клетке нет камня
            if (
              !(
                Object.prototype.hasOwnProperty.call(
                  this._cells,
                  getGridKey(this._p),
                ) &&
                (this._cells[getGridKey(this._p)].includes(Names.stones) ||
                  this._cells[getGridKey(this._p)].includes(Names.sands))
              )
            ) {
              if (
                Object.prototype.hasOwnProperty.call(
                  this._cells,
                  getGridKey(this._p),
                )
              )
                this._cells[getGridKey(this._p)].push(Names.sands);
              else this._cells[getGridKey(this._p)] = [Names.sands];

              self.store.dispatch('objects/setField', {
                field: 'grid',
                value: {
                  name: Names.sands,
                  position: this._p,
                },
              });

              this._height += randomInteger(-2, 2);
              if (this._height < 1) this._height = 1;

              (self.helper.geometry = new THREE.PlaneBufferGeometry(
                DESIGN.CELL,
                DESIGN.CELL,
                2,
                2,
              )),
                (this._mesh = new THREE.Mesh(
                  self.helper.geometry,
                  self.assets.getMaterial(Textures.sand2),
                ));
              this._mesh.rotation.x = -Math.PI / 2;
              this._mesh.position.set(
                this._x * DESIGN.CELL,
                (OBJECTS.sand.positionY = 0.1),
                this._z * DESIGN.CELL,
              );

              this._object.push({
                x: this._x,
                z: this._z,
                h: this._height,
              });

              this._meshes.add(this._mesh);
            }
          }
        }
        this._objects.push({
          name: Names.sands,
          id: '',
          data: this._object,
        });

        self.scene.add(this._meshes);
      }

      self.store.dispatch('objects/saveObjects', {
        name: Names.sands,
        objects: this._objects,
      });
    } else {
      this._objects = [...self.store.getters['objects/objects'][Names.sands]];

      this._objects.forEach((mountain) => {
        this._meshes = new THREE.Group();

        mountain.data.forEach((stone: TStone) => {
          this._position = { x: stone.x, z: stone.z };
          this._height = stone.h;

          (self.helper.geometry = new THREE.PlaneBufferGeometry(
            DESIGN.CELL,
            DESIGN.CELL,
            2,
            2,
          )),
            (this._mesh = new THREE.Mesh(
              self.helper.geometry,
              self.assets.getMaterial(Textures.sand2),
            ));
          this._mesh.rotation.x = -Math.PI / 2;
          this._mesh.position.set(
            this._position.x * DESIGN.CELL,
            OBJECTS.sand.positionY + 0.1,
            this._position.z * DESIGN.CELL,
          );

          this._meshes.add(this._mesh);
        });
        self.scene.add(this._meshes);
      });
    }

    // Вспомогательная сетка
    this._grid = new THREE.GridHelper(
      DESIGN.SIZE / 2,
      DESIGN.SIZE / DESIGN.CELL / 2,
      new THREE.Color(Colors.dark),
      new THREE.Color(Colors.dark),
    );
    this._grid.position.y += 1;
    this._grid.position.x += DESIGN.CELL / 2;
    this._grid.position.z += DESIGN.CELL / 2;
    // self.scene.add(this._grid);

    self.helper.loaderDispatchHelper(self.store, 'atmosphereIsBuild');
  }
}
