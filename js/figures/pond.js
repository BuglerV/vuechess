import AbstractFigure from "./abstractFigure"
import FigureFactory from './figureFactory'
import Game from './../Game'

import Knight from './knight'
import Bishop from './bishop'
import Queen from './queen'
import Rock from './rock'
import { last } from "lodash"

class Pond extends AbstractFigure {

	/**
	 * Направление движения пешки.
	 */
	way = null;

	/**
	 * Линия, с которой пешка может ходить на 2 клетки вперед.
	 */
	_secondLine = null;

	/**
	 * Линия, на которой происходит превращение.
	 */
	_lastLine = null;

	/**
	 * Здесь хранятся клетки, на которые можно "взять на проходе".
	 * 
	 * @var {objct|null}
	 */
	_fogAvailable = null;

	/**
	 * Пешка, которую взяли на проходе.
	 * 
	 * @var {Pond|null}
	 */
	_fogAttack = null;

	/**
	 * Создание новой фигуры.
	 * 
	 * @param {object} options 
	 */
	constructor(options) {
		super(options);

		// Если пешка стартует снизу, то идет вверх и наоборот.
		this.way = this.color == 'w' ? -1 : 1;

		// Линия, с которой пешка может сделать двойной ход.
		this._secondLine = this.color == 'w' ? Game.i.cells.length - 2 : 1;

		// Линия, с которой пешка может сделать превращение.
		this._lastLine = this.color == 'w' ? 0 : Game.i.cells.length - 1;
	};

	/**
	 * Должно вернуть название фигуры.
	 * 
	 * @returns {string}
	 */
	static getStaticName() {
		return 'Pond';
	};

	/**
	 * Возвращает все клетки, которые фигура может атаковать.
	 * 
	 * @returns {array}
	 */
	getAttackCellsArray() {
		return [
			this._getCorrectCellFormat(this.row + this.way, this.col + 1),
			this._getCorrectCellFormat(this.row + this.way, this.col - 1)
		];
	}

	/**
	 * Устанавливает все возможные ходы фигуры.
	 */
	setAvailableMoves() {
		const cells = Game.i.cells;

		// Ходы вперед.
		if( this.availableIfEmpty(cells, this.row + this.way, this.col) && this.row == this._secondLine ) {
			this.availableIfEmpty(cells, this.row + ( this.way * 2 ), this.col);
		}

		// Взятие на проходе.
		this._checkFireInTheFog();

		// Взятие по диагонали.
		this.availableIfEnemy(cells, this.row + this.way, this.col - 1);
		this.availableIfEnemy(cells, this.row + this.way, this.col + 1);
	};

	/**
	 * Когда снимаем выделение с фигуры, то нужно убрать выделение атакуемой на проходе клетки.
	 */
	_beforeInactive() {
		if( !this._fogAvailable ) {
			return;
		}

		const cell = this._getObjectFromCellFormat( this._fogAvailable );

		delete Game.i.cells[cell.row][cell.col].attack;
	}

	_checkFireInTheFog() {
		const lastMove = Game.i.getLastMove();

		// Стираем прошные значения взятия на проходе.
		this._fogAvailable = null;

		// Дальше только если последней ходила пешка.
		if( !lastMove || lastMove.figure.getName() != 'Pond' ) {
			return;
		}

		// Если это вражеская пешка.
		if( lastMove.figure.color == this.color ) {
			return;
		}

		// Только если та пешка стоит рядом около этой пешки.
		if( lastMove.to.row != this.row || Math.abs(lastMove.to.col - this.col) != 1 ) {
			return;
		}

		// Только если последний ход был на 2 клетки.
		if( Math.abs(lastMove.from.row - lastMove.to.row) != 2 ) {
			return
		}

		// Тут мы точно знаем, что есть возможность взятия на проходе.

		// Координаты взятия на проходе.
		const move = this._getCorrectCellFormat( this.row + this.way, lastMove.to.col );

		// Сохраняем в список всех ходов и в список уникальных ходов.
		this.availableCells.push(move);
		this._fogAvailable = move;

		// А также помечаем клетку как атакуемую.
		Game.i.cells[this.row + this.way][lastMove.to.col].attack = true;
	}

	/**
	 * Проверям специальные действия.
	 * 
	 * @param {object} historyRow 
	 */
	specialMoveChecks(historyRow) {
		// Если выполняется взятие на проходе.
		if( (this._fogAvailable && this._getObjectFromCellFormat(this._fogAvailable).col == historyRow.to.col) || historyRow.fog ) {
			historyRow.fog = true;

			// Съедаем вражескую пешку, которую берем на проходе.
			this._fogAttack = Game.i.cells[historyRow.from.row][this.col].figure;

			Game.i.cells[historyRow.from.row][this.col].figure = null;

			return;
		}

		// Если происходит превращение.
		if( historyRow.to.row == this._lastLine ) {
			// Если проходим по истории.
			if(historyRow.creationInto) {
				// То применяем записанный ход.
				return this.transformController(historyRow, historyRow.creationInto);
			}

			// Иначе выкидываем объект для модалки.
			return {
				// Какой метод будет ловить ответ.
				method: 'transformController',
				// Конкретный выбор.
				// Ответ: Отображение на экране.
				choice: {
					Knight: Knight.getStaticView(this.color),
					Bishop: Bishop.getStaticView(this.color),
					Rock: Rock.getStaticView(this.color),
					Queen: Queen.getStaticView(this.color)
				}
			};
		}

	}

	/**
	 * Превращаем пешку.
	 * 
	 * @param {object} historyRow 
	 * @param {any} answer 
	 */
	transformController(historyRow, answer) {
		historyRow.creationInto = answer;

		// Создаем новую фигуру.
		const createdFigure = FigureFactory['create' + answer]({
			color: this.color,
			row: this.row,
			col: this.col
		});

		// Настраиваем ее.
		createdFigure.created = true;

		// И ставим на доску, заменяя пешку.
		Game.i.cells[this.row][this.col].figure = createdFigure;
	}

	/**
	 * Проверям специальные действия при отмене.
	 * 
	 * @param {object} historyRow 
	 */
	specialUndoMoveChecks(historyRow) {
		//  Если отменяется превращение.
		if( historyRow.creationInto ) {
			Game.i.cells[this.row][this.col].figure = this;
			return;
		}

		// Если отменяется взятие на проходе.
		if( historyRow.fog ) {
			// Ставим взятую пешку обратно.
			Game.i.cells[this._fogAttack.row][this._fogAttack.col].figure = this._fogAttack;

			// И обнуляем все параметры.
			//this._fogAttack = false;

			return;
		}
	}
};

export default Pond
