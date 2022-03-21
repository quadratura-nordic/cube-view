<template>
    <div id="app">
        <button @click="show=!show">Show</button>
        <cube-view :images="['/img/1.png','/img/2.png','/img/3.png','/img/4.png','/img/5.png','/img/6.png']"
                   v-if="show"></cube-view>
        <cube-view :images="null"
                   v-if="show"></cube-view>
    </div>
</template>

<script>
    import CubeView from './components/CubeView.vue'

    export default {
        name: 'app',
        components: {
            CubeView
        },
        data() {
            return {
                show: false
            }
        }
    }
</script>

<style>
    #app {
        font-family: 'Avenir', Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-align: center;
        color: #2c3e50;
        margin-top: 60px;
    }
</style>
