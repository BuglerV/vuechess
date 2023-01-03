<template>
  <div class="history" ref="historyRef">
		<div class="history__header">История</div>
		<div class="history__table">
			<div
				class="history__element"
				:class="{history__element__disabled: !historyRow.active}"
				v-for="historyRow, index in Game.i.history"
				:key="historyRow.figure.color + historyRow.turn"
				@click="Game.i.setConcreteMove(index)"
			>
				<div class="history__turn">{{ historyRow.turn }}</div>
				<div
					class="history__image"
					v-html="historyRow.figure.getView()"
				></div>
				<div>{{ historyRow.view }}</div>
				<div>{{ historyRow.mod }}</div>
			</div>
		</div>
	</div>
</template>

<script setup>
	import { onUpdated, ref } from 'vue';
	import Game from './../Game';

	const historyRef = ref();

	onUpdated(() => {
		const element = historyRef.value.querySelector('.history__element__disabled') ??
		                historyRef.value.lastElementChild.lastElementChild;

		historyRef.value.scrollTop = element?.offsetTop - (historyRef.value.offsetHeight / 2);
	});
</script>

<style scoped lang="scss">
	.history {
		border: var(--window-border);
		height: calc(var(--cell-size) * 8);
		width: calc(var(--cell-size) * 7);
		background-color: var(--white-color);
		overflow-y: scroll;

		@media (max-width: 1050px) {
			height: calc(var(--cell-size) * 5);
		  width: calc(var(--cell-size) * 8);
		}

		&__header {
			text-align: center;
			font-size: 1.2em;
			user-select: none;
		}

		&__element {
			display: flex;
			align-items: center;
			padding: 0.2em;
			cursor: pointer;

			&:hover {
				background-color: var(--black-color);
			}

			&__disabled {
				color: #afa7a7;
			}
		}

		&__turn {
			width: 2em;
			text-align: right;
		}

		&__table {
			display: grid;
			grid-template-columns: 1fr 1fr;
			position: relative;
		}

		&__image {
			width: calc(var(--cell-size) / 2);
			height: calc(var(--cell-size) / 2);
			margin-inline: 3px;
		}
	}
</style>
