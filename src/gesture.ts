export type GestureEventHandler<T extends GestureEventDetail> = (evt: PointerOrTouchEvent, detail: T) => void;

export type Point = [ number, number ];

// Detail about a gesture event
export interface GestureEventDetail {
  x: number;
  y: number;
}

export interface StartDetail extends GestureEventDetail { }

export interface MoveDetail extends GestureEventDetail {
  startx: number;
  starty: number;
  dx: number;
  dy: number;
  vx: number;
  vy: number;
}

export interface EndDetail extends MoveDetail { }

export interface PointerOrTouchEvent extends Event {
  x?: number;
  y?: number;
  touches?: Touch[];
}

export interface GestureCreateOptions {
  el: HTMLElement;
  name: string;
  onStart: GestureEventHandler<StartDetail>;
  onMove: GestureEventHandler<MoveDetail>;
  onEnd: GestureEventHandler<EndDetail>;
  disableMouse?: boolean;
  moveOnStart?: boolean;
  passiveListeners?: boolean;
  threshold?: number;
  thresholdX?: number;
  thresholdY?: number;
  validateTarget?: (target: HTMLElement) => boolean;
}

export class Gesture implements GestureCreateOptions {
  el: HTMLElement;
  name: string;
  onStart: GestureEventHandler<StartDetail>;
  onMove: GestureEventHandler<MoveDetail>;
  onEnd: GestureEventHandler<EndDetail>;
  passiveListeners = false;
  threshold: number = null;
  thresholdX: number = null;
  thresholdY: number = null;
  hasThreshold = false;
  hasThresholdX = false;
  hasThresholdY = false;
  disableMouse: boolean = false;
  moveOnStart: boolean = false;
  validateTarget: (HTMLElement) => boolean;

  pointStart: Point;
  pointCurrent: Point;
  pointEnd: Point;
  timeCurrent: number;
  inGesture = false;
  moveDetailCurrent: MoveDetail;

  enabled = true;

  static create(options: GestureCreateOptions) {
    return new Gesture(options);
  }

  constructor({
    el,
    name,
    threshold,
    thresholdX,
    thresholdY,
    onStart,
    onMove,
    onEnd,
    validateTarget,
    disableMouse = false,
    moveOnStart = false,
    passiveListeners = false
  }: GestureCreateOptions) {
    this.el = el;
    this.name = name;
    this.passiveListeners = passiveListeners;
    this.threshold = threshold;
    this.thresholdX = thresholdX;
    this.thresholdY = thresholdY;
    // Store booleans for more efficient check later
    this.hasThreshold = this.isNumeric(threshold);
    this.hasThresholdX = this.isNumeric(thresholdX);
    this.hasThresholdY = this.isNumeric(thresholdY);
    this.onStart = onStart;
    this.onMove = onMove;
    this.onEnd = onEnd;
    this.validateTarget = validateTarget;
    this.disableMouse = disableMouse;
    this.moveOnStart = moveOnStart;

    this.bindEvents();
  }

  disable() {
    this.enabled = false;
  }

  enable() {
    this.enabled = true;
  }

  private isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }

  private bindEvents() {
    const e = this.el;
    const pe = !!('PointerEvent' in window);
    const downEvent = pe ? 'pointerdown' : 'touchstart';
    const moveEvent = pe ? 'pointermove' : 'touchmove';
    const upEvent = pe ? 'pointerup' : 'touchend';
    const cancelEvent = pe ? 'pointercancel' : 'touchcancel';


    e.addEventListener(downEvent, (ev: PointerOrTouchEvent) => {
      if ((ev as PointerEvent).pointerType === 'mouse' && this.disableMouse) {
        return;
      }
      this.down(ev);

      if (this.moveOnStart) {
        this.enabled && this.move(ev);
      }
    }, { passive: this.passiveListeners });
    e.addEventListener(moveEvent, (ev: PointerOrTouchEvent) => {
      if ((ev as PointerEvent).pointerType === 'mouse' && this.disableMouse) {
        return;
      }
      // console.log("Got move in here", this.name, this.enabled);
      this.enabled && this.move(ev);
    }, { passive: this.passiveListeners });
    e.addEventListener(upEvent, (ev: PointerOrTouchEvent) => {
      if ((ev as PointerEvent).pointerType === 'mouse' && this.disableMouse) {
        return;
      }
      this.up(ev);
    }, { passive: this.passiveListeners });
    /*
    e.addEventListener(leaveEvent, (ev: PointerOrTouchEvent) => {
      //console.log('[POINTER LEAVE]', ev);
      this.up(ev);
    });
    */
    e.addEventListener(cancelEvent, (ev: PointerOrTouchEvent) => {
      this.up(ev);
    }, { passive: this.passiveListeners });
  }

  private x(ev: PointerOrTouchEvent) {
    if (typeof ev.x === 'undefined') {
      return ev.touches[0].clientX;
    }
    return ev.x;
  }

  private y(ev: PointerOrTouchEvent) {
    if (typeof ev.y === 'undefined') {
      return ev.touches[0].clientY;
    }
    return ev.y;
  }

  private down(ev: PointerOrTouchEvent) {
    const proceed = this.validateTarget ? this.validateTarget(ev.target) : true;

    if (!proceed) {
      this.pointStart = null;
      return;
    }

    const x = this.x(ev);
    const y = this.y(ev);
    this.pointStart = [ x, y ];
  }

  private up(ev: PointerOrTouchEvent) {
    // Current point was already cleared, don't run this again
    if (!this.pointCurrent) {
      return;
    }

    const detail: EndDetail = {
      ...this.moveDetailCurrent
    };
    
    this.clear();

    this.onEnd && this.onEnd(ev, detail);
  }

  private clear() {
    this.inGesture = false;
    this.moveDetailCurrent = null;
    this.pointStart = null;
    this.pointCurrent = null;
    this.timeCurrent = null;
  }

  private move(ev: PointerOrTouchEvent) {
    if (!this.pointStart) {
      return;
    }

    let [ dx, dy ] = this.delta(ev, this.pointStart);

    let aboveThreshold = true;

    if (this.hasThreshold) {
      aboveThreshold = Math.sqrt(dx * dx + dy * dy) >= this.threshold;
    } else if (this.hasThresholdX) {
      aboveThreshold = Math.sqrt(dx * dx) >= this.thresholdX;
    } else if (this.hasThresholdY) {
      aboveThreshold = Math.sqrt(dy * dy) >= this.thresholdY;
    }

    if (!this.inGesture && !aboveThreshold) {
      return;
    }

    // If we're over the drag threshold and we aren't in the gesture, enter it
    if (!this.inGesture) {
      const detail = {
        x: this.x(ev),
        y: this.y(ev),
      };
      this.pointCurrent = [ this.x(ev), this.y(ev) ];
        
      this.inGesture = true;
      this.onStart(ev, detail);
    }

    [ dx, dy ] = this.delta(ev, this.pointCurrent);
    const [ vx, vy ] = this.vel(dx, dy);

    this.pointCurrent = [ 
      ev.x ? ev.x : ev.touches[0].clientX,
      ev.y ? ev.y : ev.touches[0].clientY
    ];
    this.timeCurrent = +new Date;

    const detail: MoveDetail = {
      startx: this.pointStart[0],
      starty: this.pointStart[1],
      x: this.x(ev),
      y: this.y(ev),
      dx,
      dy,
      vx,
      vy
    }

    this.moveDetailCurrent = detail;

    this.onMove(ev, detail);
  }

  private delta(ev: PointerOrTouchEvent, point: Point): [ number, number ] {
    const x = this.x(ev);
    const y = this.y(ev);
    return [ x - point[0], y - point[1] ];
  }

  // Compute the velocity, which is just the derivative of the change in position
  // with respect to the change from the last sample time
  private vel(dx: number, dy: number): [ number, number ] {
    const dt = +new Date - this.timeCurrent;
    const vx = dx / dt;
    const vy = dy / dt;
    return [ vx, vy ];
  }
}