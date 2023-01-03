<template>
	<div class="board-numbers-horizontal">
		<div
			v-for="letter in Game.i.lettersArray"
			:key="'horizontal-' + letter"
		>{{ letter }}</div>
	</div>
	<div class="board-numbers-vertical">
		<div
			v-for="num in Game.i.numbersArray"
			:key="'vertical-' + num"
		>{{ num }}</div>
	</div>
</template>

<script setup>
	import Game from './../Game';
</script>

<style lang="scss">
	.board-numbers-vertical {
		position: absolute;
		display: flex;
		flex-direction: column;
		top: 0;
		left: -1em;

		user-select: none;

		& > div {
			height: var(--cell-size);
			display: flex;
			align-items: center;
		}
	}
	.board-numbers-horizontal {
		position: absolute;
		display: flex;
		flex-direction: row;
		left: 0;
		top: -1.3em;

		user-select: none;

		& > div {
			width: var(--cell-size);
			text-align: center;
		}
	}
</style>
