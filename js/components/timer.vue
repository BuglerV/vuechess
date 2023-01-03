<template>
	<div :class="['timer',{timer__danger: red}]">Время: {{ timeView }}</div>
</template>

<script setup>
	import { computed } from 'vue';
	import Game from './../Game';

	const props = defineProps(['side']);

	const red = computed(() => {
		return Game.i.options.timers[props.side] < 10000;
	});

	const timeView = computed(() => {
		let newTime = new Date(0,0);
		newTime.setMilliseconds(Game.i.options.timers[props.side]);

		let view = '';

		// Часы.
		view += newTime.getHours() + ':';

		// Минуты.
		view += newTime.getMinutes() > 9 ? '' : '0';
		view += newTime.getMinutes() + ':';

		// Секунды.
		view += newTime.getSeconds() > 9 ? '' : '0';
		view += newTime.getSeconds() + '.';

		// Миллисекунды.
		view += newTime.getMilliseconds();

		return view;
	});
</script>

<style scoped lang="scss">
	.timer {
		&__danger {
			color: red;
		}

		padding: 5px;
		text-align: left;
		font-size: 1.3em;
	}
</style>
