import { Component, h, State } from '@stencil/core';

import { Plugins } from '@capacitor/core';

@Component({
  tag: 'fancy-app',
})
export class App {
  @State() demo: any = 'bottom-drawer-demo';

  componentDidLoad() {
    const { SplashScreen } = Plugins;
    SplashScreen.hide();
  }

  render() {
    const Demo = this.demo;
    return (
      <ion-app>
        <Demo />
      </ion-app>
    )
  }
}
