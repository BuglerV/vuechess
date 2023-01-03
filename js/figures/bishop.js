import AbstractFigure from "./abstractFigure";
import Game from './../Game';

class Bishop extends AbstractFigure {

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
		return 'Bishop';
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
	};
};

export default Bishop
