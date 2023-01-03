<template>
	<div
	  :class="getCellClassList()"
	  @click="cellClickReaction(row,col)"
	  v-html="cell.figure?.getView()"></div>
</template>

<script setup>
	import { inject } from 'vue';

	const props = defineProps(['col','row','cell']);

	const options = inject('options');

	function getCellClassList() {
		return [
			'cell',
			{
				cell__black: (props.row + props.col) % 2,
				cell__clickable: props.cell.figure?.color == options.move,
				cell__checked: props.cell.checked,
				cell__available: props.cell.possible,
				cell__attack: ( props.cell.possible && ( props.cell.figure || props.cell.attack ) ) || props.cell.check 
			}
		];
	}

	const cellClickReaction = inject('cellClickReaction');
</script>

<style scoped lang="scss">
  .cell {
		background-color: var(--white-color);
		display: flex;
		justify-content: center;
		align-items: center;
		width: var(--cell-size);
		height: var(--cell-size);
		font-size: 40px;
		user-select: none;

		&__black {
			background-color: var(--black-color);
		}

		&__clickable {
			cursor: pointer;
		}

		&__checked{
			background-color: var(--checked-color);
		}

		&__available {
			position: relative;
			@extend .cell__clickable;

			&:before {
				content: '';
				position: absolute;
				background-color: var(--possible-color);
				width: 20%;
				height: 20%;
				border-radius: 100%;
			}
		}

		&__attack {
			background-color: var(--attack-color);
		}
	}
</style>

<style>
	.figure {
		background-size: cover;
		background-position: center;
		height: 100%;
		width: 100%;
	}
</style>
