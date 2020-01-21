/* eslint-disable no-use-before-define */
import * as THREE from 'three';
import ChunkWorld from '../client/engine/ChunkWorld';
import Chunk from '../client/engine/Chunk';

interface IPoint<T> {
    x: number;
    y: number;
    eq: (other: T) => boolean;
    sub: (other: T) => T;
    add: (other: T) => T;
    clone: () => T;
    dist: (other: T) => number;
    toWorld: () => WorldPoint;
    toTile: () => TilePoint;
    toChunk: () => ChunkPoint;
}

export interface PointDef {
    x: number;
    y: number;
}

export class Point {
    public x: number;
    public y: number;

    public constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    public static fromDef(def: PointDef): Point {
        if (def) {
            return new Point(def.x, def.y);
        }
        return null;
    }

    public static toDef(point: Point): PointDef {
        if (point) {
            return <PointDef>{ x: point.x, y: point.y };
        }
        return null;
    }

    // public toWorld(world: ChunkWorld): WorldPoint {
    //     return this.toTile(world).toWorld();
    // }

    public toTile(world: ChunkWorld): TilePoint {
        return new TilePoint(this.x, this.y, world);
    }

    // public toChunk(world: ChunkWorld): ChunkPoint {
    //     return this.toTile(world).toChunk();
    // }

    public eq(other: Point): boolean {
        return this.x === other.x && this.y === other.y;
    }

    public sub(other: Point): Point {
        return new Point(this.x - other.x, this.y - other.y);
    }

    public add(other: Point): Point {
        return new Point(this.x + other.x, this.y + other.y);
    }

    public clone(): Point {
        return new Point(this.x, this.y);
    }

    public dist(other: Point): number {
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        return Math.sqrt((dx * dx) + (dy * dy));
    }
}

export class WorldPoint extends THREE.Vector3 {
    public world: ChunkWorld;

    public constructor(vec: THREE.Vector3, world: ChunkWorld) {
        super(vec.x, vec.y, vec.z);
        this.world = world;
    }

    public toWorld(): WorldPoint {
        return this;
    }

    public toTile(): TilePoint {
        return new TilePoint(Math.floor(this.x + 0.5), Math.floor(this.z + 0.5), this.world);
    }

    public toChunk(): ChunkPoint {
        return this.toTile().toChunk();
    }
}

export class TilePoint implements IPoint<TilePoint> {
    public world: ChunkWorld;
    public x: number;
    public y: number;

    public constructor(x: number, y: number, world: ChunkWorld) {
        this.x = x;
        this.y = y;
        this.world = world;
    }

    public toWorld(): WorldPoint {
        return new WorldPoint(new THREE.Vector3(this.x, this.elevation, this.y), this.world);
    }

    public toTile(): TilePoint {
        return this;
    }

    public static getChunkCoord(tileX: number, tileY: number, chunkSize: number): [ number, number ] {
        const halfCS = chunkSize / 2;
        return [
            Math.floor((tileX + halfCS) / chunkSize),
            Math.floor((tileY + halfCS) / chunkSize),
        ];
    }

    public toChunk(): ChunkPoint {
        const [ccx, ccy] = TilePoint.getChunkCoord(this.x, this.y, this.world.chunkSize);
        const chunk = this.world.chunks.get(ccx, ccy);
        if (!chunk) return null;
        return new ChunkPoint(
            this.x - (ccx * this.world.chunkSize) + this.world.chunkSize / 2,
            this.y - (ccy * this.world.chunkSize) + this.world.chunkSize / 2,
            chunk,
        );
    }

    public get elevation(): number {
        const chunkPoint = this.toChunk();
        if (chunkPoint) return chunkPoint.elevation;
        return null;
    }
    public set elevation(elev: number) {
        const chunkPoint = this.toChunk();
        if (chunkPoint) chunkPoint.elevation = elev;
    }

    public eq(other: TilePoint): boolean {
        return this.x === other.x && this.y === other.y;
    }

    public sub(other: TilePoint): TilePoint {
        return new TilePoint(this.x - other.x, this.y - other.y, this.world);
    }

    public add(other: TilePoint): TilePoint {
        return new TilePoint(this.x + other.x, this.y + other.y, this.world);
    }

    public clone(): TilePoint {
        return new TilePoint(this.x, this.y, this.world);
    }

    public dist(other: TilePoint): number {
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        return Math.sqrt((dx * dx) + (dy * dy));
    }
}

export class ChunkPoint implements IPoint<ChunkPoint> {
    public chunk: Chunk;
    public x: number;
    public y: number;

    public constructor(x: number, y: number, chunk: Chunk) {
        this.x = x;
        this.y = y;
        this.chunk = chunk;
    }

    public toWorld(): WorldPoint {
        return this.toTile().toWorld();
    }

    public toTile(): TilePoint {
        return new TilePoint(
            this.x + (this.chunk.def.x * this.chunk.size) - this.chunk.size / 2,
            this.y + (this.chunk.def.y * this.chunk.size) - this.chunk.size / 2,
            this.chunk.world,
        );
    }

    public toChunk(): ChunkPoint {
        return this;
    }

    public get elevation(): number {
        return this.chunk.def.heightmap[this.y * (this.chunk.world.chunkSize + 1) + this.x];
    }
    public set elevation(elev: number) {
        this.chunk.def.heightmap[this.y * (this.chunk.world.chunkSize + 1) + this.x] = elev;
    }

    public eq(other: ChunkPoint): boolean {
        return this.x === other.x && this.y === other.y;
    }

    public sub(other: ChunkPoint): ChunkPoint {
        return new ChunkPoint(this.x - other.x, this.y - other.y, this.chunk);
    }

    public add(other: ChunkPoint): ChunkPoint {
        return new ChunkPoint(this.x + other.x, this.y + other.y, this.chunk);
    }

    public clone(): ChunkPoint {
        return new ChunkPoint(this.x, this.y, this.chunk);
    }

    public dist(other: ChunkPoint): number {
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        return Math.sqrt((dx * dx) + (dy * dy));
    }
}
