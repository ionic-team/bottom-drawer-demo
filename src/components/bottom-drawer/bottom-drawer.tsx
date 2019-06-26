import { Component, h, State, Prop, Element, Watch, Event, EventEmitter } from '@stencil/core';
import { Gesture, MoveDetail, EndDetail, StartDetail } from '../../gesture';
import { bezier } from '../../easing';

@Component({
  tag: 'bottom-drawer',
  styleUrl: 'bottom-drawer.css',
  shadow: true
})
export class BottomDrawer {
  @Element() el;

  @Event() menuToggle: EventEmitter;
  @Prop() expanded = false;
  @Prop() startOffset = 20;
  @Prop() fixed
  @Prop() menuToggled: (boolean, finalY: number) => void;
  @Prop() onPositionChange: (detail: MoveDetail) => void;

  @State() active = false;

  animationCurve = bezier(0.23, 1, 0.32, 1);

  // Animation duration
  animationDuration = 400;
  // Distance from the top
  topPadding = 20;
  // Current y position of element
  y: number = 0;
  // Height of element
  height = 0;
  // Height of the content portion of the element, ignoring
  // any of the "start" height
  @State() contentHeight = 0;
  // Current gesture
  gesture: Gesture;

  componentDidLoad() {
    const screenHeight = window.innerHeight;

    if (this.hasNotch()) {
      // Add more padding at the top for the notch
      this.topPadding = 40;
    }

    this.y = screenHeight - this.startOffset;

    this.onPositionChange && this.onPositionChange({
      startx: 0,
      starty: 0,
      x: 0,
      y: this.y,
      dx: 0,
      dy: 0,
      vx: 0,
      vy: 0
    });

    this.sizeElement();

    this.slideTo(this.y);

    // Wait a frame to enable the animation to avoid having it run on start
    requestAnimationFrame(() => {
      this.enableTransition();
    });

    this.gesture = Gesture.create({
      el: this.el,
      name: 'pull-menu',
      thresholdY: 30,
      passiveListeners: true,
      validateTarget: this.gestureValidateTarget,
      onStart: this.onGestureStart,
      onMove: this.onGestureMove,
      onEnd: this.onGestureEnd,
      disableMouse: true
    });
  }

  // Check if the device has a notch
  // From https://stackoverflow.com/a/48572849
  private hasNotch() {
    if (CSS.supports('padding-bottom: env(safe-area-inset-bottom)')) {
      let div = document.createElement('div');
      div.style.paddingBottom = 'env(safe-area-inset-bottom)';
      document.body.appendChild(div);
      let calculatedPadding = parseInt(window.getComputedStyle(div).paddingBottom, 10);
      console.log('Calculated padding', calculatedPadding);
      document.body.removeChild(div);
      if (calculatedPadding > 0) {
        return true;
      }
    } else {
      console.log('Does not support safe-area-inset-bottom');
    }
    return false;
  }

  private sizeElement() {
    const e = this.el;
    const screenHeight = window.innerHeight;

    this.contentHeight = screenHeight - this.startOffset;
    this.height = (screenHeight - this.topPadding);

    e.style.height = `${this.height}px`;
  }

  private gestureValidateTarget = (target: HTMLElement): boolean => {
    let n = target;
    while (n) {
      if (n.tagName === 'ION-CONTENT') {
        return false;
      }
      n = n.parentElement;
    }
    return true;
  }

  private onGestureStart = (_ev: PointerEvent, _detail: StartDetail) => {
    this.disableTransition();
  }

  private onGestureMove = (_ev: PointerEvent, detail: MoveDetail) => {
    if (this.y <= this.topPadding) {
      // Grow the content area slightly
      this.growContentHeight(this.topPadding - this.y);
      // When we're above the limit, let the user pull but at a 
      // slower rate (to give a sense of friction)
      this.slideBy(detail.dy * 0.3);
    } else {
      this.growContentHeight(0);
      this.slideBy(detail.dy);
    }

    this.onPositionChange && this.onPositionChange(detail);
  }

  private onGestureEnd = (_ev: PointerEvent, detail: EndDetail) => {
    this.enableTransition();

    if (detail.vy < -0.8) {
      this.slideOpen();
    } else if(detail.vy > 0.8) {
      this.slideClose();
    } else if (this.y <= this.height / 2) {
      this.slideOpen();
    } else {
      this.slideClose();
    }
  }
  
  private disableTransition() {
    this.el.style.transition = '';
  }

  private enableTransition() {
    this.el.style.transition = `${this.animationDuration}ms transform cubic-bezier(0.23, 1, 0.32, 1)`;
  }

  private growContentHeight(by: number) {
    const screenHeight = window.innerHeight;
    this.contentHeight = (screenHeight - this.startOffset) + by;
  }

  private slideBy(dy: number) {
    this.slideTo(this.y + dy);
  }

  private slideTo(y: number) {
    this.y = y;
    this.el.style.transform = `translateY(${this.y}px)`;
  }

  private slideOpen() {
    // const startY = this.y;
    this.slideTo(this.topPadding);
    this.fireToggled(true, this.topPadding);
    this.afterTransition(() => {
      this.growContentHeight(0);
    });
  }

  private slideClose() {
    // const startY = this.y;
    const screenHeight = window.innerHeight;
    const finalY = screenHeight - this.startOffset;
    this.slideTo(finalY);
    this.fireToggled(false, finalY);
    this.afterTransition(() => {
      this.growContentHeight(0);
    });
  }

  private afterTransition(fn: () => void) {
    setTimeout(fn, this.animationDuration);
  }

  private fireToggled(isExpanded: boolean, finalY: number) {
    this.menuToggle.emit(isExpanded);
    this.menuToggled && this.menuToggled(isExpanded, finalY);
  }


  @Watch('expanded')
  handleExpandedChange() {
    if (this.expanded) {
      this.slideOpen();
    } else {
      this.slideClose();
    }
  }

  close = () => {
    this.active = false;
  }

  toggle = (e: MouseEvent) => {
    e;
    if (this.expanded) {
      this.slideClose();
    } else {
      this.slideOpen();
    }
  }

  render() {
    return (
      <div class={`wrapper ${this.active ? 'active' : ''}`} onClick={this.toggle}>
        <div class="menu-content">
          <div class="lip">
            <div class="lip-icon"></div>
          </div>
          <div class="start">
            <slot name="start" />
          </div>
          <div class="content" style={{ minHeight: `${this.contentHeight}px` }}>
            <slot />
          </div>
        </div>
        {/*<div class="backdrop" onClick={this.close}></div>*/}
      </div>
    );
  }
}
