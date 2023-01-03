<template>
	<Teleport to="body">
		<div v-if="isOpen" class="modal">
			<div class="modal__fog" @click="close"></div>
			<div class="modal__window">
				<div class="modal__text" v-html="winText"></div>
				<button @click="close">Закрыть</button>
			</div>
		</div>
	</Teleport>
</template>

<script setup>
	import Game from './../Game'
	import { computed, watch, ref } from 'vue'
	import King from './../figures/king'

	let isOpen = ref(false);
	let winText = ref('');

	function close() {
		Game.i.options.winner = false;
		isOpen.value = false;

	}

	watch(() => Game.i.options.winner, winner => {
		if( winner == 'n' ) {
			winText = 'Ничья!';
		} else {
			winText = 'Победа ' + King.getStaticView(winner);
		}

		isOpen.value = winner;
	});
</script>

<style scoped lang="scss">
	.modal {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		z-index: 5000;

		display: flex;
		justify-content: center;
		align-items: center;

		&__fog {
			backdrop-filter: blur(5px);
			height: 100%;
			width: 100%;
			position: absolute;
		}

		&__text {
			font-size: 1.5em;
			display: flex;
			align-items: center;
			gap: 0.5em;
		}

		&__window {
			border: var(--window-border);
			background-color: var(--white-color);
			padding: 1em;
			z-index: 5500;

			display: flex;
			flex-direction: column;
			gap: 0.5em;
		}
	}
</style>

<style>
	.modal__text .figure {
		min-width: calc(var(--cell-size) / 2) !important;
		min-height: calc(var(--cell-size) / 2) !important;
	}
</style>
