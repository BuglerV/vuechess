import AbstractFigure from "./abstractFigure";
import Game from './../Game';
import _ from "lodash";

class King extends AbstractFigure {

	/**
	 * Ходила ли фигруа. Нужно для контроля за рокировкой.
	 * 
	 * @var {boolean}
	 */
	moved = false;

	/**
	 * Здесь хранятся клетки, на которые можно сделать рокировку.
	 * 
	 * @var {Map}
	 */
	_castlingAvailable = new Map;

	/**
	 * Карта ходов короля.
	 * 
	 * @var array
	 */
	_moves = [
		[  1, -1 ], [  1, 0 ], [  1, 1 ],
		[  0, -1 ],            [  0, 1 ],
		[ -1, -1 ], [ -1, 0 ], [ -1, 1 ]
	];

	/**
	 * Должно вернуть название фигуры.
	 * 
	 * @returns {string}
	 */
	static getStaticName() {
		return 'King';
	};

	/**
	 * Обработка специальных действий во время хода.
	 */
	specialMoveChecks(hisotryRow) {
		if( !this.moved ) {
			this.moved = true;
			hisotryRow.castling = this;
		}

		const move = this._getCorrectCellFormat( hisotryRow.to.row, hisotryRow.to.col );
		
		// Если делается рокировка.
		if( this._castlingAvailable.has(move) || hisotryRow.castlingRock ) {
			const rock = hisotryRow.castlingRock ?? this._castlingAvailable.get(move);

			hisotryRow.castlingRock = rock;
			hisotryRow.castlingFrom = this._getCorrectCellFormat( rock.row, rock.col );

			// Снимам ладью с доски.
			rock.getCell().figure = null;

			let y = ( hisotryRow.to.row - hisotryRow.from.row ) / 2 + hisotryRow.from.row;
			let x = ( hisotryRow.to.col - hisotryRow.from.col ) / 2 + hisotryRow.from.col;

			rock.row = y;
			rock.col = x;

			Game.i.cells[y][x].figure = rock;
		}

		this._castlingAvailable.clear();
	}

	/**
	 * Обработка специальных действий во время отмены хода.
	 */
	specialUndoMoveChecks(hisotryRow) {
		if( this.moved && hisotryRow.castling == this ) {
			this.moved = false;
		}

		if( hisotryRow.castlingFrom ) {
			const rock = hisotryRow.castlingRock;

			// Снимам ладью с доски.
			rock.getCell().figure = null;

			const cell = this._getObjectFromCellFormat( hisotryRow.castlingFrom );

			rock.row = cell.row;
			rock.col = cell.col;

			Game.i.cells[cell.row][cell.col].figure = rock;
		}
	}

	/**
	 * Устанавливает все возможные ходы фигуры.
	 */
	setAvailableMoves() {
		this._moves.forEach(move => {
			this.availabaleIfNotAlly(Game.i.cells, this.row + move[0], this.col + move[1]);
		});

		// Рокировка.
		this._checkCastling();
	};

	/**
	 * Возвращает все клетки, которые фигура может атаковать.
	 * 
	 * @returns {array}
	 */
	getAttackCellsArray() {
		return this._moves.map(move => {
			return this._getCorrectCellFormat(this.row + move[0], this.col + move[1]);
		});
	}

	/**
	 * Считает возможна ли рокировка.
	 */
	_checkCastling() {
		// Если король уже ходил, но рокировка не доступна.
		if( this.moved ) {
			return;
		}

		this._castlingAvailable.clear();

		// Ищем ладью справа.
		this._checkLine(0, 1);
		// Ищем ладью слева.
		this._checkLine(0, -1);
	}

	_checkLine(rowDiff, colDiff) {
		let rock = false;

		let cells = Game.i.cells;

		let y = this.row;
		let x = this.col;

		while( !rock ) {
			x += colDiff;
			y += rowDiff;

			let cell;
			
			if( !cells[y] || !cells[y][x] ) {
				return;
			}

			cell = cells[y][x];

			if( !cell.figure ) {
				continue;
			}

			if( cell.figure.color != this.color || cell.figure.getName() != 'Rock' ) {
				return;
			}

			if( cell.figure.moved || cell.figure.created ) {
				return;
			}

			rock = cell.figure;
		}

		// Здесь мы точно знаем, что есть король и ладья, которые еще не ходили.
		
		this._clearAdding();
		this.constructor.addEmpty.add( this._getCorrectCellFormat(rock.row, rock.col) );

		const moves = Game.i.getAllAttackCells();

		if(
			moves.includes( this._getCorrectCellFormat( this.row, this.col ) ) ||
			moves.includes( this._getCorrectCellFormat( this.row + rowDiff, this.col + colDiff ) ) ||
			moves.includes( this._getCorrectCellFormat( this.row + rowDiff + rowDiff, this.col + colDiff + colDiff ) )
		) {
			return;
		}

		// Здесь мы точно знаем, что рокировка доступна.

		const move = this._getCorrectCellFormat( this.row + rowDiff + rowDiff, this.col + colDiff + colDiff );

		// Записываем клетку как возможную для рокировки.
		this._castlingAvailable.set(move, rock);
		this.availableCells.push(move);
		
		this._clearAdding();
	}
};

export default King
