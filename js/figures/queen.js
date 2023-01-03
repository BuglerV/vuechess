import AbstractFigure from "./abstractFigure";
import Game from './../Game';

class Queen extends AbstractFigure {

	/**
	 * Ходит ли фигура на несколько клеток в одну сторону.
	 * 
	 * @var {boolean}
	 */
	_rentgen = true;

	/**
	 * Должно вернуть название фигуры.
	 * 
	 * @returns {string}
	 */
	static getStaticName() {
		return 'Queen';
	};

	/**
	 * Устанавливает все возможные ходы фигуры.
	 */
	setAvailableMoves() {
		const cells = Game.i.cells;
		let i = 1;
		while( this.availabaleIfNotAlly(cells, this.row + i, this.col + i) ) {
			i++
		}

		i = 1;
		while( this.availabaleIfNotAlly(cells, this.row - i, this.col + i) ) {
			i++
		}

		i = 1;
		while( this.availabaleIfNotAlly(cells, this.row - i, this.col - i) ) {
			i++
		}

		i = 1;
		while( this.availabaleIfNotAlly(cells, this.row + i, this.col - i) ) {
			i++
		}

		i = 1;
		while( this.availabaleIfNotAlly(cells, this.row + i, this.col) ) {
			i++;
		}

		i = 1;
		while( this.availabaleIfNotAlly(cells, this.row, this.col + i) ) {
			i++;
		}

		i = 1;
		while( this.availabaleIfNotAlly(cells, this.row - i, this.col) ) {
			i++;
		}

		i = 1;
		while( this.availabaleIfNotAlly(cells, this.row, this.col - i) ) {
			i++;
		}
	};
};

export default Queen
