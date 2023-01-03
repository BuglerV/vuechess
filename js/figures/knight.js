import AbstractFigure from "./abstractFigure";
import Game from './../Game';

class Knight extends AbstractFigure {

	/**
	 * Карта ходов коня.
	 * 
	 * @var array
	 */
	moves = [
		[ 1, 2 ], [ 1, -2 ], [ -1, 2 ], [ -1, -2 ],
		[ 2, 1 ], [ 2, -1 ], [ -2, 1 ], [ -2, -1 ]
	];

	/**
	 * Должно вернуть название фигуры.
	 * 
	 * @returns {string}
	 */
	static getStaticName() {
		return 'Knight';
	};

	/**
	 * Устанавливает все возможные ходы фигуры.
	 */
	setAvailableMoves() {
		this.moves.forEach(move => {
			this.availabaleIfNotAlly(Game.i.cells, this.row + move[0], this.col + move[1]);
		});
	};
};

export default Knight