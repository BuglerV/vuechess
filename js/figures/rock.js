import AbstractFigure from "./abstractFigure";
import Game from './../Game';

class Rock extends AbstractFigure {

	/**
	 * Ходит ли фигура на несколько клеток в одну сторону.
	 * 
	 * @var {boolean}
	 */
	_rentgen = true;

	/**
	 * Ходила ли фигруа. Нужно для контроля за рокировкой.
	 * 
	 * @var {boolean}
	 */
	moved = false;

	/**
	 * Должно вернуть название фигуры.
	 * 
	 * @returns {string}
	 */
	static getStaticName() {
		return 'Rock';
	};

	/**
	 * Обработка специальных действий во время хода.
	 */
	specialMoveChecks(hisotryRow) {
		if( !this.moved ) {
			this.moved = true;
			hisotryRow.castling = this;
		}
	}

	/**
	 * Обработка специальных действий во время отмены хода.
	 */
	specialUndoMoveChecks(hisotryRow) {
		if( this.moved && hisotryRow.castling == this ) {
			this.moved = false;
		}
	}

	/**
	 * Устанавливает все возможные ходы фигуры.
	 */
	setAvailableMoves() {
		const cells = Game.i.cells;
		let i = 1;
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

export default Rock
