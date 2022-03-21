<template>
    <div class="load stage" ref="stage">
        <canvas class="canvas" width="1260px" height="654px" style="width:100%;margin:0;display:block"
                ref="canvas"></canvas>
        <div v-if="!imagesLoaded">
            <div class="loader"></div>
        </div>
    </div>
</template>

<script>
    import Hammer from 'hammerjs'
    import CubeMap from "./CubeMap";

    export default {
        props: ['images'],
        data() {
            return {
                imageCount: 6,
                imagesLoaded: false,
                cube: null,
                rotate: {
                    X: -15.4,
                    Y: 1.125,
                    start: {
                        X: null,
                        Y: null
                    },
                    compass: {
                        X: 0,
                        Y: 0
                    },
                    compassStart: {
                        X: null,
                        Y: null
                    }
                },
                orientation: null
            }
        },
        mounted() {
            this.cube = new CubeMap();
            this.reset();
            this.setupPan();
            this.setupCompass();
        },
        watch: {
            images() {
                this.reset();
            }
        },
        methods: {
            setupPan() {
                let stage = this.$refs.stage;
                let mc = new Hammer.Manager(stage);
                let pan = new Hammer.Pan();
                mc.add(pan);
                mc.on('panstart', () => {
                    this.rotate.start.Y = this.rotate.Y;
                    this.rotate.start.X = this.rotate.X;
                });
                mc.on('pan', (e) => {
                    var multi = 100 / e.target.clientWidth;
                    this.rotate.Y = this.rotate.start.Y + e.deltaX * multi;
                    this.rotate.X = this.rotate.start.X + e.deltaY * multi;
                    this.cube.render(this.rotate.compass.Y - this.rotate.compassStart.Y + this.rotate.Y, this.rotate.compass.X - this.rotate.compassStart.X + this.rotate.X);
                });
                mc.on('panend', () => {
                    this.rotate.start.Y = this.rotate.Y;
                    this.rotate.start.X = this.rotate.X;
                });
            },
            setupCompass() {
                if (screen && screen.orientation) {
                    this.orientation = screen.orientation.angle;
                } else {
                    this.orientation = window.orientation;
                }
                window.addEventListener("orientationchange", () => {
                    // Announce the new orientation number
                    if (screen && screen.orientation) {
                        this.orientation = screen.orientation.angle;
                    } else {
                        this.orientation = window.orientation;
                    }
                }, false);
                window.addEventListener('deviceorientation', (e) => {
                    let Y = e.alpha;
                    let X = e.beta;
                    let Z = e.gamma;
                    if (Z < 0 && this.orientation !== 0) {
                        this.rotate.compass.Y = Y;
                    } else {
                        this.rotate.compass.Y = 180 + Y;
                    }
                    if (this.orientation === 0) {
                        this.rotate.compass.X = 2 * (X - 45);
                    } else if (this.orientation === 270 || this.orientation === -90) {
                        this.rotate.compass.X = 2 * (Z - 90);
                    } else if (this.orientation === 90) {
                        this.rotate.compass.X = 2 * (-Z - 90);
                    }
                    if (this.rotate.compassStart.X == null || this.rotate.compassStart.Y == null) {
                        this.rotate.compassStart.X = this.rotate.compass.X;
                        this.rotate.compassStart.Y = this.rotate.compass.Y;
                    }
                    if (this.imagesLoaded) {
                        this.cube.render(this.rotate.compass.Y - this.rotate.compassStart.Y + this.rotate.Y, this.rotate.compass.X - this.rotate.compassStart.X + this.rotate.X);
                    }
                });
            },
            reset() {
                if (this.$refs.canvas) {
                    this.cube.init(this.$refs.canvas);
                    this.cube.render();
                    let count = 0;
                    let images = [];
                    let loadImage = (src, index) => {
                        let img = new Image();
                        img.onload = () => {
                            count++;
                            images[index] = img;
                            if (count === 6) {
                                this.imagesLoaded = true;
                                this.cube.init(this.$refs.canvas, images);
                                this.cube.render(this.rotate.compass.Y - this.rotate.compassStart.Y + this.rotate.Y, this.rotate.compass.X - this.rotate.compassStart.X + this.rotate.X);
                            }
                        };
                        img.crossOrigin = "";
                        img.src = src;
                    };
                    if (this.images) {
                        for (let key in this.images) {
                            loadImage(this.images[key], key);
                        }
                    }
                }
            }
        }
    }
</script>
