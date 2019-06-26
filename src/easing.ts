export const bezier = (p0: number, p1: number, p3: number, p4: number) => {
  return (t: number) => _bezier(t, { x: 0, y: 0 }, { x: p0, y: p1 }, { x: p3, y: p4 }, { x: 1, y: 1 });
};

const _bezier = function(t, p0, p1, p2, p3) {
  var cX = 3 * (p1.x - p0.x),
      bX = 3 * (p2.x - p1.x) - cX,
      aX = p3.x - p0.x - cX - bX;

  var cY = 3 * (p1.y - p0.y),
      bY = 3 * (p2.y - p1.y) - cY,
      aY = p3.y - p0.y - cY - bY;

  var x = (aX * Math.pow(t, 3)) + (bX * Math.pow(t, 2)) + (cX * t) + p0.x;
  var y = (aY * Math.pow(t, 3)) + (bY * Math.pow(t, 2)) + (cY * t) + p0.y;

  return {x: x, y: y};
};


  // Interpolation function with easing support
export const interpolate = (start: number,
                            end: number,
                            duration: number,
                            f: (t: number) => { x: number, y: number },
                            cb: (value: number) => void) => {
  const delta = end - start;

  let x = start;
  let lastTime = +new Date;
  let startTime = lastTime;
  // const totalFrames = (duration / 1000) * 60;

  let t = 0;

  const update = () => {
    const now = +new Date;
    const dt = now - lastTime;
    const elapsed = now - startTime;
    t = Math.min(elapsed / duration, 1);
    const v = f(t);
    console.log(v);

    const frames = duration / dt;
    const dx = delta / frames;
    // cb(x += dx);

    const pos = start + delta * v.y;

    cb(pos);
    x += dx;
    if (start < end && x > end) {
      return;
    }
    if (start > end && x < end) {
      return;
    }

    lastTime = now;

    requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}