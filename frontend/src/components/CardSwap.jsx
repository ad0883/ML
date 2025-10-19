// filepath: /Users/akbroc/Desktop/ML/frontend/src/components/CardSwap.jsx
import React, { Children, cloneElement, forwardRef, isValidElement, useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import './CardSwap.css';

export const Card = forwardRef(({ customClass, ...rest }, ref) => (
  <div ref={ref} {...rest} className={`cs-card ${customClass ?? ''} ${rest.className ?? ''}`.trim()} />
));
Card.displayName = 'Card';

const makeSlot = (i, distX, distY, total) => ({ x: i * distX, y: -i * distY, z: -i * distX * 1.5, zIndex: total - i });
const placeNow = (el, slot, skew) => gsap.set(el, { x: slot.x, y: slot.y, z: slot.z, xPercent: -50, yPercent: -50, skewY: skew, transformOrigin: 'center center', zIndex: slot.zIndex, force3D: true });

const CardSwap = ({ width = 500, height = 400, cardDistance = 60, verticalDistance = 70, delay = 5000, pauseOnHover = false, onCardClick, onActiveChange, skewAmount = 6, easing = 'elastic', children }) => {
  const config = easing === 'elastic' ? { ease: 'elastic.out(0.6,0.9)', durDrop: 2, durMove: 2, durReturn: 2, promoteOverlap: 0.9, returnDelay: 0.05 } : { ease: 'power1.inOut', durDrop: 0.8, durMove: 0.8, durReturn: 0.8, promoteOverlap: 0.45, returnDelay: 0.2 };
  const childArr = useMemo(() => Children.toArray(children), [children]);
  const refs = useMemo(() => childArr.map(() => React.createRef()), [childArr.length]);
  const order = useRef(Array.from({ length: childArr.length }, (_, i) => i));
  const tlRef = useRef(null);
  const intervalRef = useRef();
  const timeoutRef = useRef();
  const container = useRef(null);

  useEffect(() => {
    const total = refs.length;
    refs.forEach((r, i) => placeNow(r.current, makeSlot(i, cardDistance, verticalDistance, total), skewAmount));

    // Notify initial active (front) without swapping
    const raf = requestAnimationFrame(() => onActiveChange?.(order.current[0] ?? 0));

    const swap = () => {
      if (order.current.length < 2) return;
      const [front, ...rest] = order.current;
      const elFront = refs[front].current;
      const tl = gsap.timeline();
      tlRef.current = tl;

      tl.to(elFront, { y: '+=500', duration: config.durDrop, ease: config.ease });

      // When others are promoted, the new front is rest[0]
      tl.addLabel('promote', `-=${config.durDrop * config.promoteOverlap}`);
      // Remove onActiveChange at 'promote' to avoid early update
      // tl.call(() => { onActiveChange?.(rest[0] ?? front); }, undefined, 'promote');

      rest.forEach((idx, i) => {
        const el = refs[idx].current;
        const slot = makeSlot(i, cardDistance, verticalDistance, refs.length);
        tl.set(el, { zIndex: slot.zIndex }, 'promote');
        tl.to(el, { x: slot.x, y: slot.y, z: slot.z, duration: config.durMove, ease: config.ease }, `promote+=${i * 0.15}`);
      });

      const backSlot = makeSlot(refs.length - 1, cardDistance, verticalDistance, refs.length);
      tl.addLabel('return', `promote+=${config.durMove * config.returnDelay}`);
      tl.call(() => { gsap.set(elFront, { zIndex: backSlot.zIndex }); }, undefined, 'return');
      tl.to(elFront, { x: backSlot.x, y: backSlot.y, z: backSlot.z, duration: config.durReturn, ease: config.ease }, 'return');

      // Notify active when the new front is fully in place
      tl.call(() => { onActiveChange?.(rest[0] ?? front); }, undefined, 'return');

      tl.call(() => { order.current = [...rest, front]; });
    };

    // Kick off first swap after the delay to avoid initial desync
    timeoutRef.current = window.setTimeout(() => {
      swap();
      intervalRef.current = window.setInterval(swap, delay);
    }, delay);

    if (pauseOnHover) {
      const node = container.current;
      const pause = () => { tlRef.current?.pause(); clearInterval(intervalRef.current); };
      const resume = () => { tlRef.current?.play(); intervalRef.current = window.setInterval(swap, delay); };
      node.addEventListener('mouseenter', pause);
      node.addEventListener('mouseleave', resume);
      return () => {
        node.removeEventListener('mouseenter', pause);
        node.removeEventListener('mouseleave', resume);
        clearInterval(intervalRef.current);
        clearTimeout(timeoutRef.current);
      };
    }

    return () => { clearInterval(intervalRef.current); clearTimeout(timeoutRef.current); cancelAnimationFrame(raf); };
  }, [refs.length, cardDistance, verticalDistance, delay, pauseOnHover, skewAmount, easing, onActiveChange]);

  const rendered = childArr.map((child, i) => isValidElement(child) ? cloneElement(child, { key: i, ref: refs[i], style: { width, height, ...(child.props.style ?? {}) }, onClick: e => { child.props.onClick?.(e); onCardClick?.(i); } }) : child);

  return (
    <div ref={container} className="cs-card-swap-container" style={{ width, height }}>
      {rendered}
    </div>
  );
};

export default CardSwap;
