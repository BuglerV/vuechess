<template>
	<div id="game">
		<Menu />
		<Board />
		<History />
	</div>
	<GameModal />
	<WinnerModal />
</template>

<script setup>
	import { provide, reactive, toRaw } from 'vue';
	import Game from './../Game';
	import Board from './board';
	import Menu from './menu';
	import History from './history';

	import GameModal from './gameModal.vue';
	import WinnerModal from './winnerModal.vue';

	Game.setWrapper( reactive );
	Game.setUnwrapper( toRaw );
	const game = new Game;
	game.startClassicGame();

	window.game = game;

	provide('options', game.options);
	provide('cellClickReaction', (row, col) => {
		game.cellClickReaction(row, col);
	});
</script>

<style lang="scss" scoped>
  #game {
		display: flex;
		justify-content: center;
		flex-direction: row;
		align-items: center;
		min-height: 100%;
		gap: 2em;
		min-height: 100vh;
		background-color: var(--background-color);
		padding: 1em;
		box-sizing: border-box;

		@media (max-width: 1050px) {
			flex-direction: column;
		}
	}
</style>
