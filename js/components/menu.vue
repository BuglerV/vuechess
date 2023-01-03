<template>
	<div class="menu">
		<Timer side="b"/>
		<div>
			<div class="move">
				<span>Ход:</span>
				<span v-html="King.getStaticView(Game.i.options.move)" class="move__icon"></span>
			</div>
			<div class="menu__buttons">
				<button @click="Game.i.undoMove()">Назад</button>
				<button @click="Game.i.forwardMove()">Вперед</button>
				<button @click="modalIsOpen = true">Игра</button>
			</div>
		</div>
		<Timer side="w"/>
	</div>
	<MenuModal :isOpen="modalIsOpen" @close="modalIsOpen = false" />
</template>

<script setup>
	import Timer from './timer';
	import Game from './../Game';
	import MenuModal from './menuModal';
	import King from './../figures/king';

	import { ref } from 'vue';

	const modalIsOpen = ref(false);
</script>

<style scoped lang="scss">
	.menu {
		border: var(--window-border);
		background-color: var(--white-color);
		height: calc(var(--cell-size) * 8);
		width: calc(var(--cell-size) * 5);

		display: flex;
		flex-direction: column;
		justify-content: space-between;

		text-align: center;

		&__buttons {
			margin-top: 1em;
		}

		@media (max-width: 1050px) {
			height: calc(var(--cell-size) * 3);
			width: calc(var(--cell-size) * 8);
		}
	}
	.move {
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5em;
		user-select: none;

		&__icon {
			height: calc(var(--cell-size) / 2);
		  width: calc(var(--cell-size) / 2);
		}
	}
</style>
