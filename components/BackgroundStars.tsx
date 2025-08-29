// components/BackgroundStars.tsx
'use client';
import { useEffect, useRef } from 'react';

type Star = {
  x:number; y:number; z:number;
  r:number; c:string;
  vx:number; vy:number;
  phase:number;        // 0..1
  speed:number;        // blink speed
  duty:number;         // on-time (0..1) -> 0.5 = 50% on
};

export default function BackgroundStars() {
  const ref = useRef<HTMLCanvasElement|null>(null);

  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext('2d')!;

    const DPR = Math.min(2, window.devicePixelRatio || 1);

    // ---- CONFIG (tune yahi se) ----
    const COLORS = ['#cfeeff','#aee2ff','#9fb4ff','#ffffff'];
    const BASE_AREA_DIV = 16000;     // base density divisor (smaller => more stars)
    const COUNT_MULTIPLIER = 2;   // +25% stars
    const MOVE_SPEED = 0.30;         // drift
    const SIZE_MIN = 0.25, SIZE_MAX = 0.9; // tiny stars (px)
    const BG = '#000000';            // pure black background
    const BLINK_SPEED_MIN = 0.35, BLINK_SPEED_MAX = 0.75; // higher => faster blink
    const BLINK_DUTY_MIN  = 0.35, BLINK_DUTY_MAX  = 0.65; // 35–65% ON time

    let W=0, H=0, stars: Star[] = [];

    const fit = () => {
      W = cv.width  = Math.floor(window.innerWidth  * DPR);
      H = cv.height = Math.floor(window.innerHeight * DPR);
      cv.style.width = '100%'; cv.style.height = '100%';
      build();
    };

    const rand = (a:number,b:number)=>Math.random()*(b-a)+a;

    function build(){
      const area = (W*H)/(DPR*DPR);
      const count = Math.floor((area/BASE_AREA_DIV) * COUNT_MULTIPLIER);
      stars = Array.from({length: count}, () => ({
        x: rand(0,W), y: rand(0,H),
        z: rand(0.7,1.1),
        r: rand(SIZE_MIN, SIZE_MAX),
        c: COLORS[(Math.random()*COLORS.length)|0],
        vx: rand(-MOVE_SPEED, MOVE_SPEED),
        vy: rand(-MOVE_SPEED, MOVE_SPEED),
        phase: Math.random(),                                  // random start
        speed: rand(BLINK_SPEED_MIN, BLINK_SPEED_MAX),         // blink speed
        duty:  rand(BLINK_DUTY_MIN,  BLINK_DUTY_MAX),          // on-time %
      }));
    }

    function tick(){
      // pure black background
      ctx.fillStyle = BG;
      ctx.fillRect(0,0,W,H);

      // stars
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      for(const s of stars){
        // move + wrap
        s.x += s.vx*s.z; s.y += s.vy*s.z;
        if (s.x<0) s.x=W; if (s.x>W) s.x=0;
        if (s.y<0) s.y=H; if (s.y>H) s.y=0;

        // instant blink (square wave)
        s.phase += s.speed*0.016;
        if (s.phase >= 1) s.phase -= 1;
        const on = s.phase < s.duty; // true => draw, false => off

        if (on) {
          const rad = s.r * DPR;
          ctx.shadowBlur = 6;
          ctx.shadowColor = s.c;
          ctx.fillStyle = s.c;
          ctx.beginPath();
          ctx.arc(s.x, s.y, rad, 0, Math.PI*2);
          ctx.fill();
        }
      }

      ctx.restore();
      requestAnimationFrame(tick);
    }

    window.addEventListener('resize', fit);
    fit(); tick();
    return () => window.removeEventListener('resize', fit);
  }, []);

  return (
    <canvas
      ref={ref}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
