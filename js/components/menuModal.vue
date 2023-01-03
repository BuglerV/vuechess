<template>
	<Teleport to="body">
		<div v-if="isOpen" class="menu__modal">
			<div class="menu__modal__fog" @click="close"></div>
			<div class="menu__modal__window">
				<h3 class="center">Общие настройки</h3>
				<div v-for="(color) in colors" :key="color.name" class="menu__between">
					<label :for="color.name">{{ color.title }}</label>
					<input
					  type="color"
					  v-model="color.value"
					  :id="color.name"
						@input="variableChange(color.name,$event.target.value)"
					/>
				</div>
				<div class="center">
					<button v-if="!Game.i.options.paused" @click="Game.i.pause()">Пауза</button>
					<button v-if="Game.i.options.paused" @click="Game.i.unpause()">Снять паузу</button>
				</div>
				<hr>
				<h3 class="center">Новая игра</h3>
				<div class="menu__between">
					<label for="total-seconds">Секунд на игру: </label>
					<input type="number" id="total-seconds" v-model="options.total"/>
				</div>
				<div class="menu__between">
					<label for="add-seconds">Секунд за ход: </label>
					<input type="number" id="add-seconds" v-model="options.add"/>
				</div>
				<div class="center">
					<button @click="startNewGame('classic')">Классика</button>
					<button @click="startNewGame('fisher')">Шахматы Фишера</button>
				</div>
				<hr>
				<div class="center">
					<button @click="close">Закрыть</button>
				</div>
			</div>
		</div>
	</Teleport>
</template>

<script setup>
	import Game from './../Game'
	import { ref } from 'vue'

	const props = defineProps(['isOpen']);
	const emits = defineEmits(['close']);

	const colors = ref([
		{
			name: '--white-color',
			title: 'Цвет белых клеток',
			value: variableGet('--white-color') ?? '#cacad9'
		},
		{
			name: '--black-color',
			title: 'Цвет черных клеток',
			value: variableGet('--black-color') ?? '#257069'
		},
		{
			name: '--background-color',
			title: 'Цвет фона',
			value: variableGet('--background-color') ?? '#4caf50'
		}
	]);

	const options = ref({
		total: 120,
		add: 2
	});

	function close() {
		emits('close');
	}

	function startNewGame(variant) {
		const option = {
			timers: {
				w: options.value.total * 1000,
				b: options.value.total * 1000,
				add: options.value.add * 1000
			}
		}

		const method = variant == 'classic' ? 'startClassicGame' : 'startFisherGame';

		Game.i[method](option);

		close();
	}

	function variableGet(key) {
		const value = localStorage.getItem(key);

		value && document.querySelector(':root').style.setProperty(key, value);

		return value;
	};

	function variableChange(key, value) {
		document.querySelector(':root').style.setProperty(key, value);
		localStorage.setItem(key,value);
	}
</script>

<style scoped lang="scss">
	.menu {
		&__modal {
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

		&__between {
			display: flex;
			justify-content: space-between;
		}
	}
</style>
