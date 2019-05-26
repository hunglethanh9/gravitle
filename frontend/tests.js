import * as utils from './utils.js';

//
// Contains a list of Universe configurations used to test the different
// features of Gravitle.
//

const get_test_9 = () => {
    const test = {
        id: 'test_9',
        title: 'Triangle wrapping around',
        description: `
            A triangle should go upward, wrap around to appear at the bottom
            and then collide with the bottom particle and create links between
            itself and the particle.
            Links should then be destroyed when they intersect and be created
            again when two particle collides.
        `,
        conf: utils.get_base_conf_copy()
    };
    test.conf.wrap_around = true;
    test.conf.drag_coefficient = 0.001;
    test.conf.collision_behavior = 'create-link';
    test.conf.link_intersection_behavior = 'destroy-links';
    test.conf.particles = [
        {
            x: 1,
            y: 80
        },
        {
            x: 2,
            y: 90
        },
        {
            x: -5,
            y: 85
        },
        {
            x: 0,
            y: -50,
            fixed: true,
            mass: 10,
            diameter: 10
        }
    ];
    test.conf.links = [
        {
            p1_index: 0,
            p2_index: 1
        },{
            p1_index: 1,
            p2_index: 2
        },{
            p1_index: 2,
            p2_index: 0
        }
    ];
    return test;
};

const get_tests = () => {
    let list = [];
    list.push(get_test_9());
    return list;
};

const get_test_by_id = (id) => {
    let tests = get_tests();
    let return_test = null;
    tests.forEach(test => {
        if (test.id === id) {
            return_test = test;
        } else {
            // Do nothing
        }
    });
    return return_test;
};

export {
    get_test_9,
    get_test_by_id,
    get_tests
};
