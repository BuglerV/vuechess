<template>
		<div class="board">
			<Numbers />
			<div class="line"
				v-for="(row, rowIdx) of Game.i.cells"
				:key="'row-' + rowIdx"
			>
				<Cell v-for="(cell, colIdx) of row"
							:key="'cell-' + rowIdx + colIdx"
							:row="rowIdx"
							:col="colIdx"
							:cell="cell"
				/>
			</div>
		</div>
</template>

<script setup>
	import Cell from './cell.vue';
	import Numbers from './numbers.vue';
	import Game from './../Game';
</script>

<style scoped lang="scss">
	.board {
		border: var(--window-border);
		position: relative;
	}
	.line {
		display: flex;
		flex-direction: row;
	}
</style>
