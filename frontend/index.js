import {
    Universe
} from 'gravitle';
import { memory } from "gravitle/gravitle_bg";

const fps_infos = document.getElementById('fps-infos');
const infos = document.getElementById('infos');
const reloadButton = document.getElementById('button-reload');
const stepButton = document.getElementById('button-step');
const startButton = document.getElementById('button-start');
const stopButton = document.getElementById('button-stop');
const heartButton = document.getElementById('button-heart');
const diamondButton = document.getElementById('button-diamond');
const randomizeButton = document.getElementById('button-randomize');
const symetryButton = document.getElementById('button-symetry');
const spaceCroquetButton = document.getElementById('button-space-croquet');
const clubButton = document.getElementById('button-club');
const spadeButton = document.getElementById('button-spade');
const buttonExample5 = document.getElementById('button-example-5');
const jsonTextarea = document.getElementById('json');
const inputCount = document.getElementById('input-count');
const inputWidth = document.getElementById('input-width');
const inputHeight = document.getElementById('input-height');
const inputG = document.getElementById('input-g');

const inputTrajectoriesPeriod = document.getElementById('input-trajectories-period');
const buttonTrajectoriesOn = document.getElementById('button-trajectories-on');
const buttonTrajectoriesOff = document.getElementById('button-trajectories-off');

const canvas = document.getElementById('canvas');
canvas.height = 1000;
canvas.width = 1000;
const context = canvas.getContext("2d");

let MODE = null;
let SHOW_TRAJECTORIES = null;

const BASE_CONF = Object.freeze({
    width: 200,
    height: 200,
    delta_time: 0.01,
    gravitational_constant: 66.74,
    minimal_distance_for_gravity: 0.1,
    algorithm: 'verlet',
    intersection_behavior: 'do-nothing',
    collision_behavior: 'do-nothing',
    stabilise_positions_enabled: false,
    stabiliser_power: 10,
    particles: []
});

let space_croquet_links = null;

const universe = Universe.new();
universe.load_from_json(JSON.stringify(BASE_CONF));
const launchers = [];

let interval = null;
let time = null;
let delta = null;
let last = null;
let mouse_positions = null;
const frame_gaps = [];
let last_now = null;

randomizeButton.addEventListener('click', () => {
    randomize();
});

symetryButton.addEventListener('click', () => {
    symetry();
});

reloadButton.addEventListener('click', () => {
    reload();
});

stepButton.addEventListener('click', () => {
    tick();
});

startButton.addEventListener('click', () => {
    start();
});

stopButton.addEventListener('click', () => {
    stop();
});

heartButton.addEventListener('click', () => {
    heart();
});

diamondButton.addEventListener('click', () => {
    diamond();
});

clubButton.addEventListener('click', () => {
    club();
});

spadeButton.addEventListener('click', () => {
    spade();
});

buttonExample5.addEventListener('click', () => {
    loadExample5();
});

spaceCroquetButton.addEventListener('click', () => {
    spaceCroquet();
});

buttonTrajectoriesOn.addEventListener('click', () => {
    trajectoriesOn();
});

buttonTrajectoriesOff.addEventListener('click', () => {
    trajectoriesOff();
});

inputG.addEventListener('change', () => {
    const conf = JSON.parse(jsonTextarea.value);
    conf.gravitational_constant = parseFloat(inputG.value);
    universe.set_gravitational_constant(conf.gravitational_constant);
    jsonTextarea.value = JSON.stringify(conf, null, 4);
});

inputWidth.addEventListener('change', () => {
    const conf = JSON.parse(jsonTextarea.value);
    conf.width = parseFloat(inputWidth.value);
    universe.set_width(conf.width);
    jsonTextarea.value = JSON.stringify(conf, null, 4);
});

inputHeight.addEventListener('change', () => {
    const conf = JSON.parse(jsonTextarea.value);
    conf.height = parseFloat(inputHeight.value);
    universe.set_height(conf.height);
    jsonTextarea.value = JSON.stringify(conf, null, 4);
});

canvas.addEventListener('mousedown', (event) => {
    mouse_positions = {};
    mouse_positions.down = getMousePos(canvas, event);
    mouse_positions.up = mouse_positions.down;
});

canvas.addEventListener('mousemove', (event) => {
    if (mouse_positions) {
        mouse_positions.up = getMousePos(canvas, event);
    } else {
        // Do nothing
    }
});

canvas.addEventListener('mouseup', (event) => {
    mouse_positions.up = getMousePos(canvas, event);
    launchParticle(mouse_positions);
    mouse_positions = null;
});

const renderLoop = () => {
    infos.textContent = universe.get_infos();
    draw();
    updateFps();
    requestAnimationFrame(renderLoop);
}

const updateFps = () => {
    const gap = Date.now() - last_now;
    last_now = Date.now();
    frame_gaps.push(gap);
    while(frame_gaps.length > 100) {
        frame_gaps.shift();
    }
    let gaps_sum = 0.0;
    const count = frame_gaps.length;
    for (let i = 0 ; i < count ; i+=1) {
        gaps_sum += frame_gaps[i];
    }
    const fps = 1.0 / (gaps_sum / count / 1000.0);
    fps_infos.textContent = "FPS : " + fps.toFixed(0);
};

const draw = () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (MODE === 'SPACE-CROQUET') {
        drawLaunchers();
    } else {
        // Do nothing
    }
    const period = parseInt(inputTrajectoriesPeriod.value);
    if (SHOW_TRAJECTORIES === true && period > 0) {
        drawTrajectories(period);
    } else {
        // DO nothing
    }
    drawSegments();
    drawParticles();
    drawMouseInteraction();
};

const trajectoriesOn = () => {
    buttonTrajectoriesOn.disabled = true;
    buttonTrajectoriesOff.disabled = false;
    SHOW_TRAJECTORIES = true;
}

const trajectoriesOff = () => {
    buttonTrajectoriesOn.disabled = false;
    buttonTrajectoriesOff.disabled = true;
    SHOW_TRAJECTORIES = false;
}

const drawLaunchers = () => {
    context.strokeStyle = "#888";
    context.lineWidth = 2;
    for (let i = 0 ; i < launchers.length ; i += 1 ) {
        context.beginPath();
        context.moveTo(launchers[i].up.x, launchers[i].up.y);
        context.lineTo(launchers[i].down.x, launchers[i].down.y);
        context.stroke();
    }
};

const drawTrajectories = (period) => {
    const trajectories = universe.get_trajectories_position_at_period(period);
    context.strokeStyle = "#888";
    context.lineWidth = 1;
    const diameter = 1;
    for (let i = 0 ; i < trajectories.length ; i += 2) {
        const p = getPositionFromUniverseToCanvas({
            x: trajectories[i + 0],
            y: trajectories[i + 1]
        });
        context.beginPath();
        context.arc(
            p.x,
            p.y,
            diameter,
            0,
            2 * Math.PI
        );
        context.stroke();
    }
}

const drawSegments = () => {
    const linksPointer = universe.get_links();
    const linksCount = universe.get_links_count();
    const LINK_SIZE = 5;
    const links = new Float64Array(memory.buffer, linksPointer, linksCount * LINK_SIZE);
    const universeWidth = universe.get_width();
    const universeHeight = universe.get_height();
    const unitX = canvas.width / universeWidth;
    const unitY = canvas.height / universeHeight;
    context.strokeStyle = "#eee";
    context.lineWidth = 4;
    for (let id = 0 ; id < linksCount ; id += 1 ) {
        let i = id * LINK_SIZE;
        const p1 = getPositionFromUniverseToCanvas({
            x: links[i + 0],
            y: links[i + 1]
        });
        const p2 = getPositionFromUniverseToCanvas({
            x: links[i + 2],
            y: links[i + 3]
        });
        context.beginPath();
        context.moveTo(p1.x, p1.y);
        context.lineTo(p2.x, p2.y);
        context.stroke();
    }
};

const drawParticles = () => {
    const particlesPointer = universe.get_particles();
    const particlesCount = universe.get_particles_count();
    const PARTICLE_SIZE = 13;
    const particles = new Float64Array(memory.buffer, particlesPointer, particlesCount * PARTICLE_SIZE);
    const unitX = canvas.width / universe.get_width();
    const unitY = canvas.height / universe.get_height();
    context.strokeStyle = "#FFF";
    context.lineWidth = 4;
    for (let i = 0 ; i < particles.length ; i+= PARTICLE_SIZE ) {
        const position = getPositionFromUniverseToCanvas({
            x: particles[i + 0],
            y: particles[i + 1]
        });
        const diameter = (unitX / 2) * particles[i + 2];
        context.beginPath();
        context.arc(
            position.x,
            position.y,
            diameter,
            0,
            2 * Math.PI
        );
        context.stroke();
    }
};

const drawMouseInteraction = () => {
    if (mouse_positions) {
        // Position
        const unitX = canvas.width / universe.get_width();
        const diameter = (unitX / 2);
        context.strokeStyle = "#eef";
        context.lineWidth = 4;
        context.beginPath();
        context.arc(
            mouse_positions.down.x,
            mouse_positions.down.y,
            diameter,
            0,
            2 * Math.PI
        );
        context.stroke();
        // Line
        context.strokeStyle = "#ddf";
        context.beginPath();
        context.moveTo(mouse_positions.down.x, mouse_positions.down.y);
        context.lineTo(mouse_positions.up.x, mouse_positions.up.y);
        context.stroke();
    } else {
        // Do nothing
    }
}

const start = () => {
    time = Date.now();
    interval = setInterval(tickMultiple, 1);
    startButton.disabled = true;
    stopButton.disabled = false;
};

const stop = () => {
    if(interval) {
        clearInterval(interval);
    } else {
        // NTD
    }
    startButton.disabled = false;
    stopButton.disabled = true;
};

const tick = () => {
    universe.tick();
    if (universe.get_particles_to_disable_indexes_length() && MODE === 'SPACE-CROQUET') {
        universe.set_links_json(JSON.stringify(space_croquet_links));
    } else {
        // Do nothing
    }
};

const tickMultiple = () => {
    const now = Date.now();
    delta = now - time;
    const resolution = universe.get_delta_time_milli();
    while (delta > resolution) {
        delta -= resolution;
        tick();
    }
    time = now - delta;
};

const heart = () => {
    MODE = null;
    const conf = jsonCopy(BASE_CONF);
    conf.particles = [
        {
            "x": 0,
            "y": 20
        }, {
            "x": 10,
            "y": 30
        }, {
            "x": 20,
            "y": 30
        }, {
            "x": 30,
            "y": 20
        }, {
            "x": 20,
            "y": 5
        }, {
            "x": 10,
            "y": -10
        }, {
            "x": 0,
            "y": -20
        }, {
            "x": -10,
            "y": 30
        }, {
            "x": -20,
            "y": 30
        }, {
            "x": -30,
            "y": 20
        }, {
            "x": -20,
            "y": 5
        }, {
            "x": -10,
            "y": -10
        }, {
            "x": 0,
            "y": -35
        }
    ];
    conf.stabilise_positions_enabled = true;
    jsonTextarea.value = JSON.stringify(conf, null, 4);
    reload();
};

const diamond = () => {
    MODE = null;
    const conf = jsonCopy(BASE_CONF);
    conf.particles = [
        {
            "x": -30,
            "y": -40,
            "fixed": false
        }, {
            "x": -30,
            "y": -41,
            "fixed": false
        }, {
            "x": 0,
            "y": 41,
            "fixed": false
        }, {
            "x": 20,
            "y": 20,
            "fixed": true
        }, {
            "x": 20,
            "y": -20,
            "fixed": true
        }, {
            "x": -20,
            "y": 20,
            "fixed": true
        }, {
            "x": -20,
            "y": -20,
            "fixed": true
        }, {
            "x": 0,
            "y": 40,
            "fixed": true
        }, {
            "x": 0,
            "y": -40,
            "fixed": true
        }, {
            "x": 40,
            "y": 0,
            "fixed": true
        }, {
            "x": -40,
            "y": 0,
            "fixed": true
        }
    ];
    jsonTextarea.value = JSON.stringify(conf, null, 4);
    reload();
};

const club = () => {
    MODE = null;
    const conf = jsonCopy(BASE_CONF);
    conf.particles = [
        {
            "x": 0.01,
            "y": -25,
            "fixed": false
        },
        {
            "x": 10,
            "y": -35,
            "fixed": false
        },
        {
            "x": -10,
            "y": -35,
            "fixed": false
        },
        {
            "x": 0,
            "y": 40,
            "fixed": true,
            "diameter": 5,
            "mass": 5
        },
        {
            "x": 40,
            "y": -10,
            "fixed": true,
            "diameter": 5,
            "mass": 5
        },
        {
            "x": -40,
            "y": -10,
            "fixed": true,
            "diameter": 5,
            "mass": 5
        }
    ];
    jsonTextarea.value = JSON.stringify(conf, null, 4);
    reload();
}

const spade = () => {
    MODE = null;
    const conf = jsonCopy(BASE_CONF);
    conf.intersection_behavior = 'destroy-link';
    conf.particles = [
        {
            "x": 0,
            "y": 35
        },
        {
            "x": 10,
            "y": 25,
            "fixed": true
        },
        {
            "x": -10,
            "y": 25,
            "fixed": true
        },{
            "x": 15,
            "y": 15,
            "fixed": true
        },
        {
            "x": -15,
            "y": 15,
            "fixed": true
        },{
            "x": 20,
            "y": 5,
            "fixed": true
        },
        {
            "x": -20,
            "y": 5,
            "fixed": true
        },{
            "x": 15,
            "y": 0,
            "fixed": true
        },
        {
            "x": -15,
            "y": 0,
            "fixed": true
        },{
            "x": 5,
            "y": -5,
            "fixed": true
        },
        {
            "x": -5,
            "y": -5,
            "fixed": true
        },{
            "x": 10,
            "y": -10,
            "fixed": true
        },
        {
            "x": -10,
            "y": -10,
            "fixed": true
        }
    ];
    conf.links = [
        {
            "p1_index": 1,
            "p2_index": 2
        }, {
            "p1_index": 3,
            "p2_index": 4
        }, {
            "p1_index": 5,
            "p2_index": 6
        }, {
            "p1_index": 7,
            "p2_index": 8
        }, {
            "p1_index": 9,
            "p2_index": 10
        }, {
            "p1_index": 11,
            "p2_index": 12
        }
    ];
    jsonTextarea.value = JSON.stringify(conf, null, 4);
    reload();
}

const loadExample5 = () => {
    MODE = null;
    const conf = jsonCopy(BASE_CONF);
    conf.intersection_behavior = 'destroy-particle';
    conf.particles = [
        {
            "x": 0,
            "y": 0
        },
        {
            "x": -10,
            "y": 30,
            "fixed": true
        },
        {
            "x": 10,
            "y": 30,
            "fixed": true
        },
        {
            "x": -10,
            "y": -10,
            "fixed": true
        },
        {
            "x": 10,
            "y": -10,
            "fixed": true
        },
        {
            "x": -40,
            "y": 35,
            "fixed": false
        },
        {
            "x": 40,
            "y": 35,
            "fixed": false
        },
        {
            "x": -50,
            "y": 30,
            "fixed": true
        },
        {
            "x": 50,
            "y": 30,
            "fixed": true
        }
    ];
    conf.links = [
        {
            "p1_index": 0,
            "p2_index": 1
        },
        {
            "p1_index": 0,
            "p2_index": 2
        },
        {
            "p1_index": 3,
            "p2_index": 4
        },
        {
            "p1_index": 5,
            "p2_index": 6
        }
    ];
    jsonTextarea.value = JSON.stringify(conf, null, 4);
    reload();
}

const randomize = () => {
    MODE = null;
    const conf = getParameterizedConf();
    const particles = [];
    for (let i = 0 ; i < parseFloat(inputCount.value) ; i += 1) {
        const x = getRandomIntInclusive(- conf.width / 10, conf.width / 10);
        const y = getRandomIntInclusive(- conf.height / 5, conf.height / 5);
        const mass = getRandomNumber(0.5, 5.0);
        const fixed = false;
        const diameter = mass;
        particles.push({
            x: x,
            y: y,
            mass: mass,
            fixed: fixed,
            diameter: diameter
        });
    }
    conf.particles = particles;
    jsonTextarea.value = JSON.stringify(conf, null, 4);
    reload();
}

const symetry = () => {
    MODE = 'SYMETRY';
    const conf = getParameterizedConf();
    conf.stabilise_positions_enabled = true;
    conf.stabiliser_power = 10;
    conf.intersection_behavior = 'destroy-link';
    conf.collision_behavior = 'create-link';
    const particles = [];
    for (let i = 0 ; i < parseFloat(inputCount.value) / 2 ; i += 1) {
        const x = getRandomIntInclusive(- conf.width / 10, conf.width / 10);
        const y = getRandomIntInclusive(- conf.height / 5, conf.height / 5);
        const mass = getRandomNumber(0.5, 5.0);
        const fixed = false;
        const diameter = mass;
        particles.push({
            x: x,
            y: y,
            mass: mass,
            fixed: fixed,
            diameter: diameter
        });
        particles.push({
            x: -x,
            y: y,
            mass: mass,
            fixed: fixed,
            diameter: diameter
        });
    }
    conf.particles = particles;
    jsonTextarea.value = JSON.stringify(conf, null, 4);
    reload();
}

const spaceCroquet = () => {
    MODE = 'SPACE-CROQUET';
    const conf = getParameterizedConf();
    conf.intersection_behavior = 'destroy-link';
    const particles = [];
    const links = [];
    const zones = [];
    const maxDiameter = 5.0;
    const checkpointLength = conf.width / 8;
    const innerRadius = checkpointLength / 2;
    const zoneRadius = innerRadius + maxDiameter / 2;
    for (let i = 0 ; i < parseFloat(inputCount.value) / 2.0 ; i += 1) {
        let x = getRandomIntInclusive(- conf.width / 4, conf.width / 4);
        let y = getRandomIntInclusive(- conf.height / 4, conf.height / 4);
        let i = 1000;
        while (isInZones(x, y, zones, zoneRadius) && i > 0) {
            x = getRandomIntInclusive(- conf.width / 4, conf.width / 4);
            y = getRandomIntInclusive(- conf.height / 4, conf.height / 4);
            i -= 1;
        }
        if (i) {
            zones.push({
                x: x,
                y: y,
                diameter: zoneRadius * 2,
                radius: zoneRadius,
                fixed: true
            });
        }
    }
    for (let i = 0 ; i < zones.length ; i += 1) {
        const mass = getRandomNumber(maxDiameter, maxDiameter);
        const fixed = true;
        const diameter = mass;
        const angle = getRandomIntInclusive(0, 359);
        const p1 = getCoordinateRotatedAround(
            {
                x: zones[i].x,
                y: zones[i].y
            },
            {
                x: zones[i].x + innerRadius,
                y: zones[i].y
            },
            angle
        );
        const p2 = getCoordinateRotatedAround(
            {
                x: zones[i].x,
                y: zones[i].y
            },
            {
                x: zones[i].x - innerRadius,
                y: zones[i].y
            },
            angle
        );
        particles.push({
            x: p1.x,
            y: p1.y,
            mass: mass,
            fixed: fixed,
            diameter: diameter
        });
        particles.push({
            x: p2.x,
            y: p2.y,
            mass: mass,
            fixed: fixed,
            diameter: diameter
        });
        links.push({
            "p1_index": i*2,
            "p2_index": i*2+1
        });
    }
    conf.particles = particles;
    conf.links = links;
    space_croquet_links = links;
    jsonTextarea.value = JSON.stringify(conf, null, 4);
    reload();
}

const getCoordinateRotatedAround = (center, point, angle) => {
    const angleRad = (angle) * (Math.PI / 180);
    return {
        x: Math.cos(angleRad) * (point.x - center.x) - Math.sin(angleRad) * (point.y - center.y) + center.x,
        y: Math.sin(angleRad) * (point.x - center.x) + Math.cos(angleRad) * (point.y - center.y) + center.y
    };
}

const isInZones = (x, y, zones, zoneRadius) => {
    let r = false;
    for (const index in zones) {
        const zone = zones[index];
        if (circlesCollide(x, y, zone.x, zone.y, zone.radius, zoneRadius)) {
            r = true;
        } else {
            // Do nothing
        }
    }
    return r;
}

const circlesCollide = (x1, y1, x2, y2, zoneRadius1, zoneRadius2) => {
    const distance_squared_centers = get_distance_squared(x1, y1, x2, y2);
    const diameters_squared = (zoneRadius1 + zoneRadius2) * (zoneRadius1 + zoneRadius2);
    return distance_squared_centers < diameters_squared;
}

const get_distance_squared = (x1, y1, x2, y2) => {
    const delta_x = x1 - x2;
    const delta_y = y1 - y2;
    return delta_x * delta_x + delta_y * delta_y;
}

const getParameterizedConf = () => {
    const conf = jsonCopy(BASE_CONF);
    conf.width = parseFloat(inputWidth.value);
    conf.height = parseFloat(inputHeight.value);
    conf.gravitational_constant = parseFloat(inputG.value);
    return conf;
}

const jsonCopy = (object) => {
    return JSON.parse(JSON.stringify(object));
}

const getRandomBoolean = () => {
    return Math.random() > 0.5;
}

const getRandomNumber = (min, max) => {
    return Math.random() * (max - min) + min;
}

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const reload = () => {
    // Reload parameters values fro json
    const parsedJson = JSON.parse(jsonTextarea.value);
    inputWidth.value = parsedJson.width;
    inputHeight.value = parsedJson.height;
    inputG.value = parsedJson.gravitational_constant;
    // Reload universe
    stop();
    universe.reset();
    launchers.length = 0;
    interval = null;
    time = null;
    delta = null;
    universe.load_from_json(jsonTextarea.value);
    start();
};

const getIndex = (row, column) => {
    return row * width + column;
};

const getMousePos = (canvas, event) => {
    const rect = canvas.getBoundingClientRect(); // abs. size of element
    const scaleX = canvas.width / rect.width;   // relationship bitmap vs. element for X
    const scaleY = canvas.height / rect.height;  // relationship bitmap vs. element for Y
    return {
        x: (event.clientX - rect.left) * scaleX,   // scale mouse coordinates after they have
        y: (event.clientY - rect.top) * scaleY     // been adjusted to be relative to element
    }
}

const getPositionFromCanvasToUniverse = (position_in_canvas) => {
    const universeWidth = universe.get_width();
    const universeHeight = universe.get_height();
    return {
        x: position_in_canvas.x / canvas.width * universeWidth - universeWidth * 0.5,
        y: - (position_in_canvas.y / canvas.height * universeHeight - universeHeight * 0.5)
    }
}

const getPositionFromUniverseToCanvas = (position_in_universe) => {
    const universeWidth = universe.get_width();
    const universeHeight = universe.get_height();
    const unitX = canvas.width / universeWidth;
    const unitY = canvas.height / universeHeight;
    return {
        x: (universeWidth / 2) * unitX + position_in_universe.x * unitX,
        y: (universeHeight / 2) * unitY - position_in_universe.y * unitY
    }
}

const launchParticle = (mouse_position) => {
    const position_in_universe = getPositionFromCanvasToUniverse(mouse_positions.down);
    const position_in_universe_old = getPositionFromCanvasToUniverse(mouse_positions.up);
    const dx = position_in_universe_old.x - position_in_universe.x;
    const dy = position_in_universe_old.y - position_in_universe.y;
    const sensibility = 0.01;
    let collision_behavior = 'do-nothing';
    if (MODE === 'SPACE-CROQUET') {
        collision_behavior = 'disable-self';
    } else {
        // Do nothing
    }
    universe.add_particle_json(JSON.stringify(
        {
            x: position_in_universe.x,
            y: position_in_universe.y,
            old_x: position_in_universe.x + dx * sensibility,
            old_y: position_in_universe.y + dy * sensibility,
            collision_behavior: collision_behavior
        }
    ));
    launchers.push(mouse_position);
    if (MODE === 'SPACE-CROQUET') {
        universe.set_links_json(JSON.stringify(space_croquet_links));
    } else {
        // Do nothing
    }
}

trajectoriesOff();
heart();
last_now = Date.now();
requestAnimationFrame(renderLoop);

