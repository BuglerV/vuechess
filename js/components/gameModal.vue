<template>
	<Teleport to="body">
		<div v-if="Game.i.modalContent.isOpen" class="modal">
			<div class="modal__window">
				<div
					class="modal__choice"
					v-for="(value, key) in Game.i.modalContent.choice"
					:key="key"
					v-html="value"
					@click="Game.i.specialMoveController(key)"
				></div>
			</div>
		</div>
	</Teleport>
</template>

<script setup>
	import Game from './../Game'
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

		&__window {
			border: var(--window-border);
			background-color: var(--white-color);
			padding: 1em;
			z-index: 5500;

			display: flex;
			flex-direction: row;
			gap: 0.5em;
		}

		&__choice {
			min-width: var(--cell-size) !important;
			min-height: var(--cell-size) !important;
			cursor: pointer;

			&:hover {
				background-color: var(--black-color);
			}
		}
	}
</style>
