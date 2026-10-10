import { gsap } from "gsap";

const cards = [...document.querySelectorAll(".card")];
const spotlight = document.querySelector(".spotlight");

const PROXIMITY_RADIUS = 500;
const PUSH_FORCE = 0.35;
const TILT_AMOUNT = 0.1;
const SPRING_STIFFNESS = 0.07;
const BOUNCE_FRICTION = 0.9;
const CURSOR_SMOOTHING = 0.75;

const layout = {
    rotation: [5, -5, 7.5, -10],
    x: [-275, -100, 100, 275],
    y: [10, -10, 25, -10],
};

const cursor = { x: 0, y: 0, vx: 0, vy: 0 };
let previousCursor = { x: 0, y: 0 };

const cardPhysics = cards.map((el, index) => {
    const card = {
        el,
        restX: layout.x[index] ?? 0,
        restY: layout.y[index] ?? 0,
        restR: layout.rotation[index] ?? 0,
        x: layout.x[index] ?? 0,
        y: layout.y[index] ?? 0,
        r: layout.rotation[index] ?? 0,
        vx: 0,
        vy: 0,
        vr: 0,
    };

    gsap.set(el, {
        x: card.x,
        y: card.y,
        rotation: card.r,
        xPercent: -50,
        yPercent: -50,
        zIndex: index,
    });

    return card;
});

spotlight.addEventListener("mousemove", (event) => {
    const nextX = event.clientX;
    const nextY = event.clientY;

    cursor.vx =
        cursor.vx * CURSOR_SMOOTHING +
        (nextX - previousCursor.x) * (1 - CURSOR_SMOOTHING);
    cursor.vy =
        cursor.vy * CURSOR_SMOOTHING +
        (nextY - previousCursor.y) * (1 - CURSOR_SMOOTHING);
    cursor.x = nextX;
    cursor.y = nextY;
    previousCursor = { x: nextX, y: nextY };
});

spotlight.addEventListener("mouseleave", () => {
    cursor.vx = 0;
    cursor.vy = 0;
});

function calculatePushForce(card) {
    const spotlightRect = spotlight.getBoundingClientRect();
    const cardCenterX = spotlightRect.left + spotlightRect.width / 2 + card.restX;
    const cardCenterY = spotlightRect.top + spotlightRect.height / 2 + card.restY;
    const distance = Math.hypot(
        cursor.x - cardCenterX,
        cursor.y - cardCenterY,
    );

    if (distance > PROXIMITY_RADIUS) {
        return { fx: 0, fy: 0 };
    }

    const weight = 1 - distance / PROXIMITY_RADIUS;
    return {
        fx: cursor.vx * weight * PUSH_FORCE,
        fy: cursor.vy * weight * PUSH_FORCE,
    };
}

gsap.ticker.add(() => {
    const forces = cardPhysics.map(calculatePushForce);

    cardPhysics.forEach((card, index) => {
        const force = forces[index];
        const neighborForce = forces.reduce(
            (result, neighbor, neighborIndex) => {
                if (neighborIndex === index) return result;
                const falloff = 1 / (1 + Math.abs(neighborIndex - index));
                return {
                    fx: result.fx + neighbor.fx * falloff * 0.2,
                    fy: result.fy + neighbor.fy * falloff * 0.2,
                };
            },
            { fx: force.fx, fy: force.fy },
        );

        card.vx =
            (card.vx +
                (card.restX + neighborForce.fx - card.x) *
                    SPRING_STIFFNESS) *
            BOUNCE_FRICTION;
        card.vy =
            (card.vy +
                (card.restY + neighborForce.fy - card.y) *
                    SPRING_STIFFNESS) *
            BOUNCE_FRICTION;
        card.vr =
            (card.vr +
                (card.restR +
                    neighborForce.fx * TILT_AMOUNT -
                    card.r) *
                    SPRING_STIFFNESS) *
            BOUNCE_FRICTION;

        card.x += card.vx;
        card.y += card.vy;
        card.r += card.vr;

        gsap.set(card.el, {
            x: card.x,
            y: card.y,
            rotation: card.r,
        });
    });
});
