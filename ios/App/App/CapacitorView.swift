import Capacitor

@objc(CapacitorView)
public class CapacitorView: CAPPlugin {
  var previewVC: PreviewViewController?
  
  @objc func open(_ call: CAPPluginCall) {
    guard let url = call.getString("url") else {
      call.reject("Must provide a URL")
      return
    }
    print("Opening new Capacitor view at URL", url)
    
    previewVC = PreviewViewController()
    previewVC!.url = url
    previewVC!.closeHandler = {() -> Void in
      self.previewVC!.dismiss(animated: true, completion: {
        call.resolve()
      })
    }
    previewVC!.shakeHandler = {() -> Void in
    }
  

    DispatchQueue.main.async {
      self.bridge.viewController.present(self.previewVC!, animated: true) {
        print ("Closed cap view")
      }
    }
  }
}

class PreviewViewController : UIViewController, UIGestureRecognizerDelegate {
  public var capVC: CAPBridgeViewController?
  public var url: String?
  public var closeHandler: (() -> Void)?
  public var shakeHandler: (() -> Void)?
  
  public override func viewDidLoad() {
    guard let url = self.url else {
      print("Missing URL")
      return
    }
    
    self.view.isUserInteractionEnabled = true
    self.view.bounds = UIScreen.main.bounds
    
    let gesture = UISwipeGestureRecognizer(target: self, action: #selector(self.handleThreeFingerSwipe))
    gesture.delegate = self
    gesture.direction = .down
    gesture.delaysTouchesBegan = true
    gesture.numberOfTouchesRequired = 2
    
    self.view.addGestureRecognizer(gesture)
    
    capVC = CAPBridgeViewController()
    
    capVC!.config = "{ \"server\": { \"url\": \"\(url)\" }}"
    capVC!.view.frame = UIScreen.main.bounds
    self.view.addSubview(capVC!.view!)
  }
  
  @objc func handleThreeFingerSwipe() {
    if self.closeHandler != nil {
      self.closeHandler!()
    }
  }
  
  public func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer) -> Bool {
    return true
  }
  
  public override func motionEnded(_ motion: UIEvent.EventSubtype, with event: UIEvent?) {
    if event?.type == .motion && event?.subtype == .motionShake {
      if self.shakeHandler != nil {
        self.shakeHandler!()
      }
    }
  }
}
