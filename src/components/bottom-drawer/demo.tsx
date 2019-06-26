import { Component, h, State } from '@stencil/core';
import { MoveDetail } from '../../gesture';

@Component({
  tag: 'bottom-drawer-demo',
  styleUrl: 'demo.css'
})
export class BottomDrawerDemo {
  pullRef: HTMLBottomDrawerElement;

  @State() isPullMenuExpanded = false;

  // @State() bgOffset = 0;

  bgRef: HTMLDivElement;
  bgTransition: string = '100ms transform ease-in-out';
  startingY = null;

  // Settings for the photos slider
  photosSliderOptions = {
    spaceBetween: 0,
    initialSlide: 0,
    slidesPerView: 2.825,
    slidesOffsetBefore: 13,
    zoom: {
      toggle: false
    }
  }

  // Settings for the planets slider
  planetsSliderOptions = {
    spaceBetween: 0,
    initialSlide: 0,
    slidesPerView: 1.75,
    slidesOffsetBefore: 13,
    zoom: {
      toggle: false
    }
  }

  componentDidLoad() {
    this.disableParallaxAnimation();
  }

  // Animate the image we are apply a parallax effect to, either to completely close
  // or to completely expand it.
  animateParallax = (expanded, finalY) => {
    expanded;

    if (!this.bgRef) {
      return;
    }

    this.bgRef.style.transition = this.bgTransition;

    const diff = this.startingY - finalY;
    const offset = -diff * 0.2;

    window.requestAnimationFrame(() => {
      this.bgRef.style.transform = `translate3d(0, ${offset}px, 0)`;
    });
  }

  disableParallaxAnimation = () => {
    this.bgRef.style.transition = '';
  }

  handleMenuToggled = (expanded, finalY) => {
    this.isPullMenuExpanded = expanded;

    this.animateParallax(expanded, finalY);
  }

  handleMenuPositionChange = (detail: MoveDetail) => {
    // If we don't have a starting y, then store it and use it to compute the
    // absolute delta from the starting position, so we can compute the parallax amount
    if (!this.startingY) {
      this.startingY = detail.y;
    }

    // Turn off any CSS animation for the image we will apply a parallax effect to
    this.disableParallaxAnimation();

    const diff = this.startingY - detail.y;

    window.requestAnimationFrame(() => {
      if (diff <= 0) {
        // We are bottomed out, so should rubber band the image
        const scale = 1 + -diff * 0.00025;
        this.bgRef.style.transform = `translate3d(0, 0, 0) scale(${scale})`;
      } else {
        // If the diff is > zero, that means
        // we are not bottomed-out and should just slide the image up
        const y = -diff * 0.2;
        this.bgRef.style.transform = `translate3d(0, ${y}px, 0)`;
      }
    });
  }

  demoClick = (e: MouseEvent) => {
    e.stopPropagation();
  }

  showMenu = async (e: MouseEvent) => {
    const popoverController = document.querySelector('ion-popover-controller');
    await popoverController.componentOnReady();
  
    const popover = await popoverController.create({
      component: 'popover-example-page',
      event: e,
      translucent: true
    });
    return await popover.present();
  }

  render() {
    return (
      <div class="screen">
        <ion-popover-controller />

        <div
          class="bg"
          ref={(e) => this.bgRef = e} />

        <div class="heading">
          <h1>Red Planet</h1>
          <div class="more" onClick={this.showMenu}>
            <ion-icon name="md-more"></ion-icon>
          </div>
        </div>

        <bottom-drawer
          ref={(e: HTMLBottomDrawerElement) => this.pullRef = e}
          expanded={this.isPullMenuExpanded}
          startOffset={230}
          onMenuToggled={this.handleMenuToggled}
          onPositionChange={this.handleMenuPositionChange}
          >
          <div slot="start" class="start-content">
            <h2>Mars</h2>
            <h4>54.6 million km away</h4> 
            <div class="buttons">
              <ion-button color="dark" onClick={this.demoClick}>Directions</ion-button>
              <ion-button color="light" onClick={this.demoClick}>Start</ion-button>
            </div>
            <div class="facts">
              <div class="fact">
                <h5>-10° C</h5>
                <small>Temperature</small>
              </div>
              <div class="fact">
                <h5>4:12 AM</h5>
                <small>Sunrise</small>
              </div>
              <div class="fact">
                <h5>8:40 PM</h5>
                <small>Sunset</small>
              </div>
              <div class="fact">
                <h5>600 Pa</h5>
                <small>Pressure</small>
              </div>
            </div>
          </div>
          <ion-content>
            <ion-list>
              <ion-item detail>
                <ion-avatar slot="start">
                  <ion-icon name="person" />
                </ion-avatar>
                <ion-label>
                  Are you here now?
                </ion-label>
              </ion-item>
              <ion-item detail>
                <ion-avatar slot="start">
                  <ion-icon name="share" />
                </ion-avatar>
                <ion-label>
                  Share with a friend
                </ion-label>
              </ion-item>
              <ion-item detail>
                <ion-avatar slot="start">
                  <ion-icon name="planet" />
                </ion-avatar>
                <ion-label>
                  mars.nasa.gov
                </ion-label>
              </ion-item>
              <ion-item detail>
                <ion-avatar slot="start">
                  <ion-icon name="md-create" />
                </ion-avatar>
                <ion-label>
                  Suggest an edit
                </ion-label>
              </ion-item>
            </ion-list>
            <div class="info">
              <h3>Description</h3>
              <p>
                Mars is the fourth planet from the Sun and the second-smallest planet in the Solar System after Mercury. In English, Mars carries a name of the Roman god of war, and is often referred to as the "Red Planet"[15][16] because the iron oxide prevalent on its surface gives it a reddish appearance that is distinctive among the astronomical bodies visible to the naked eye.[17] Mars is a terrestrial planet with a thin atmosphere, having surface features reminiscent both of the impact craters of the Moon and the valleys, deserts, and polar ice caps of Earth.
              </p>
            </div>

            <div class="info info-photos bordered">
              <h3>Photos</h3>
              <ion-slides options={this.photosSliderOptions}>
                <ion-slide>
                  <ion-card>
                    <img src="/assets/mars/1.png" />
                  </ion-card>
                </ion-slide>
                <ion-slide>
                  <ion-card>
                    <img src="/assets/mars/2.png" />
                  </ion-card>
                </ion-slide>
                <ion-slide>
                  <ion-card>
                    <img src="/assets/mars/3.png" />
                  </ion-card>
                </ion-slide>
                <ion-slide>
                  <ion-card>
                    <img src="/assets/mars/4.png" />
                  </ion-card>
                </ion-slide>
                <ion-slide>
                  <ion-card>
                    <img src="/assets/mars/5.png" />
                  </ion-card>
                </ion-slide>
              </ion-slides>
            </div>

            <div class="info info-planets bordered">
              <h3>Related Planets</h3>
              <ion-slides options={this.planetsSliderOptions}>
                <ion-slide>
                  <ion-card>
                    <img src="/assets/planets/earth.png" />
                  </ion-card>
                </ion-slide>
                <ion-slide>
                  <ion-card>
                    <img src="/assets/planets/jupiter.png" />
                  </ion-card>
                </ion-slide>
                <ion-slide>
                  <ion-card>
                    <img src="/assets/planets/neptune.png" />
                  </ion-card>
                </ion-slide>
                <ion-slide>
                  <ion-card>
                    <img src="/assets/planets/uranus.png" />
                  </ion-card>
                </ion-slide>
                <ion-slide>
                  <ion-card>
                    <img src="/assets/planets/venus.png" />
                  </ion-card>
                </ion-slide>
                <ion-slide>
                  <ion-card>
                    <img src="/assets/planets/mercury.png" />
                  </ion-card>
                </ion-slide>
                <ion-slide>
                  <ion-card>
                    <img src="/assets/planets/saturn.png" />
                  </ion-card>
                </ion-slide>
              </ion-slides>
            </div>
          </ion-content>
        </bottom-drawer>
      </div>
    )
  }
}

customElements.define('popover-example-page', class ModalContent extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <style>
        ion-list {
          --ion-background-color: transparent;
        }
      </style>
      <ion-list>
        <ion-item button>Favorite</ion-item>
        <ion-item button>Search the web</ion-item>
      </ion-list>
    `;
  }
});