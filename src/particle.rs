//
// Helper struct 
//
struct ValueWithDistance {
    value: f64,
    d: f64
}

//
// Represent 2d coordinates
//
struct Point {
    x: f64,
    y: f64
}

//
// Particle definition
//
#[derive(Copy, Clone)]
pub struct Particle {
    x: f64,
    y: f64,
    diameter: f64,
    forces_x: f64,
    forces_y: f64,
    acceleration_x: f64,
    acceleration_y: f64,
    mass: f64,
    old_x: f64,
    old_y: f64,
    speed_x: f64,
    speed_y: f64,
    id: u32,
    is_fixed: bool
}

//
// Private method for Particle
//
impl Particle {

    //
    // Create a new Particle
    //
    pub fn new(id: u32) -> Particle {
        Particle {
            x: 0.0,
            y: 0.0,
            diameter: 1.0,
            forces_x: 0.0,
            forces_y: 0.0,
            acceleration_x: 0.0,
            acceleration_y: 0.0,
            mass: 1.0,
            old_x: 0.0,
            old_y: 0.0,
            id: id,
            speed_x: 0.0,
            speed_y: 0.0,
            is_fixed: false
        }
    }

    //
    // Load
    //
    pub fn load_from_json(&mut self, json_string: String) {
        let json_parsed = &json::parse(&json_string).unwrap();
        self.x = json_parsed["x"].as_f64().unwrap_or(self.x);
        self.y = json_parsed["y"].as_f64().unwrap_or(self.y);
        self.diameter = json_parsed["diameter"].as_f64().unwrap_or(self.diameter);
        self.old_x = self.x;
        self.old_y = self.y;
        self.mass = json_parsed["mass"].as_f64().unwrap_or(self.mass);
        self.is_fixed = json_parsed["fixed"].as_bool().unwrap_or(self.is_fixed);
     }

    //
    // Reset forces for the Particle
    //
    pub fn reset_forces(& mut self) {
        self.forces_x = 0.0;
        self.forces_y = 0.0;
    }

    //
    // Add gravity forces exerced on the Particle by the rest of the Particles
    //
    pub fn add_gravity_forces(
            & mut self,
            particles: & Vec<Particle>,
            gravitational_constant: f64,
            world_width: f64,
            world_height: f64,
            minimal_distance_for_gravity: f64
    ) {
        if self.is_fixed {
            // NTD
        } else {
    
            for particle in particles {
                if particle.id != self.id {
                    let clones_coordinates = Particle::get_boxing_clones_coordinates(
                        self.x,
                        self.y,
                        particle.x,
                        particle.y,
                        world_width,
                        world_height
                    );
                    for clone in clones_coordinates {
                        let distance = Particle::get_distance(
                            self.x, self.y,
                            clone.x, clone.y
                        );
                        let force;
                        if distance > minimal_distance_for_gravity {
                            force = - gravitational_constant * self.mass * particle.mass / (distance * distance);
                        } else {
                            // Particles are too close, which can result in instability
                            force = 0.0;
                        }
                        let delta_x = self.x - clone.x;
                        let delta_y = self.y - clone.y;
                        let force_x = delta_x * force;
                        let force_y = delta_y * force;
                        self.forces_x += force_x;
                        self.forces_y += force_y;
                    }
                } else {
                    // NTD
                }
            }
        }
    }

    //
    // Update the acceleration of the Particle
    //
    pub fn update_acceleration(& mut self) {
        self.acceleration_x = self.forces_x / self.mass;
        self.acceleration_y = self.forces_y / self.mass;
    }

    //
    // Update the speed of the Particle
    //
    pub fn update_speed(&mut self, delta_time: f64) {
        self.speed_x = self.speed_x + self.acceleration_x * delta_time;
        self.speed_y = self.speed_y + self.acceleration_y * delta_time;
    }

    //
    // Update the position of the Particle using the Euler Algorithm
    //
    pub fn update_position_euler(&mut self, delta_time: f64) {
        self.x += self.speed_x * delta_time;
        self.y += self.speed_y * delta_time;
    }

    //
    // Update the position of the Particle using the Verlet Algorithm
    //
    pub fn update_position_verlet(&mut self, delta_time: f64) {
        let current_x = self.x;
        let current_y = self.y;
        let new_x = 2.0 * current_x - self.old_x + self.acceleration_x * delta_time * delta_time ;
        let new_y = 2.0 * current_y - self.old_y + self.acceleration_y * delta_time * delta_time ;
        self.old_x = current_x;
        self.old_y = current_y;
        self.x = new_x;
        self.y = new_y;
    }

    //
    // Recenter a particle if it got outside the Universe
    //
    pub fn recenter(
            &mut self,
            world_width: f64,
            world_height: f64
    ) {
        let x_max = world_width / 2.0;
        let x_min = -x_max;
        let y_max = world_height / 2.0;
        let y_min = -y_max;
        let mut x = self.x + x_max - x_min - x_min;
        while x > x_max - x_min {
            x -= x_max - x_min;
        }
        x += x_min;
        let mut y = self.y + y_max - y_min - y_min;
        while y > y_max - y_min {
            y -= y_max - y_min;
        }
        y += y_min;
        self.x = x;
        self.y = y;
    }

    //
    // Getter for current coordinates
    //
    pub fn get_coordinates(& self) -> (f64, f64) {
        (self.x, self.y)
    }

    //
    // Getter for old coordinates
    //
    pub fn get_old_coordinates(& self) -> (f64, f64) {
        (self.old_x, self.old_y)
    }

    //
    // Checks whether two particles collide
    //
    pub fn particles_collide(p1: & Particle, p2: & Particle) -> bool {
        let distance_squared_centers = Particle::get_distance_squared(p1.x, p1.y, p2.x, p2.y);
        let radiuses_squared = ((p1.diameter * 0.5) + (p2.diameter * 0.5)) * ((p1.diameter * 0.5) + (p2.diameter * 0.5));
        return distance_squared_centers < radiuses_squared && p1.id != p2.id;
    }
}

//
// Private methods
//
impl Particle {

    //
    // Helper function to get a distance squared
    //
    fn get_distance_squared(x1: f64, y1: f64, x2: f64, y2: f64) -> f64 {
        let delta_x = x1 - x2;
        let delta_y = y1 - y2;
        return delta_x * delta_x + delta_y * delta_y;
    }

    //
    // Helper function to get a distance
    //
    fn get_distance(
            x1: f64, y1: f64,
            x2: f64, y2: f64
    ) -> f64 {
        let d2 = Particle::get_distance_squared(x1, y1, x2, y2);
        return d2.sqrt();
    }

    //
    // Get cloned points based on p1
    // boxing a point p2
    // where p1 clones are translation of p1
    // by width and/or height of the Universe.
    //
    // If p1 and p2 have same x or same y,
    // returns only 2 clones
    //
    // Used to compute gravity through the visible edges of the Universe.
    //
    fn get_boxing_clones_coordinates(
            x1: f64, y1: f64,
            x2: f64, y2: f64,
            width: f64, height: f64
    ) -> Vec<Point> {
        let mut clones = Vec::new();
        let ws = [-width, 0.0, width];
        let hs = [-height, 0.0, height];
        let mut xs = Vec::new();
        let mut ys = Vec::new();
        for w in ws.iter() {
            let x = x2 + w;
            let distance_squared = Particle::get_distance_squared(x1, 0.0, x, 0.0);
            xs.push( ValueWithDistance {
                value: x,
                d: distance_squared
            });
        }
        for h in hs.iter() {
            let y = y2 + h;
            let distance_squared = Particle::get_distance_squared(0.0, y1, 0.0, y);
            ys.push( ValueWithDistance {
                value: y,
                d: distance_squared
            });
        }
        // Order by ascending distance
        xs.sort_by(|a, b| a.d.partial_cmp(&b.d).unwrap());
        ys.sort_by(|a, b| a.d.partial_cmp(&b.d).unwrap());
        //
        if x1 == x2 && y1 == y2 {
            // NTD
        } else if x1 == x2 {
            for _ in 0..2 {
                for i in 0..2 {
                    clones.push(Point {
                        x: x1,
                        y: ys[i].value
                    });
                }
            }
        } else if y1 == y2 {
            for _ in 0..2 {
                for i in 0..2 {
                    clones.push(Point {
                        x: xs[i].value,
                        y: y1
                    });
                }
            }
        } else {
            for i in 0..2 {
                for j in 0..2 {
                    clones.push(Point {
                        x: xs[i].value,
                        y: ys[j].value
                    });
                }
            }
        }
        return clones;
    }
}

//
// Unit tests
//
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    pub fn test_get_boxing_clones_coordinates() {
        let x1: f64 = 0.0;
        let y1: f64 = 0.0;
        let x2: f64 = 1.0;
        let y2: f64 = 2.0;
        let width: f64 = 10.0;
        let height: f64 = 8.0;
        let mut clones = Vec::new();
        clones.push(Point {
            x: 1.0,
            y: 2.0
        });
        clones.push(Point {
            x: 1.0,
            y: -6.0
        });
        clones.push(Point {
            x: -9.0,
            y: 2.0
        });
        clones.push(Point {
            x: -9.0,
            y: -6.0
        });
        let clones2 = Particle::get_boxing_clones_coordinates(
            x1,
            y1,
            x2,
            y2,
            width,
            height
        );
        assert_eq!(4, clones2.len());
        assert_eq!(clones[0].x, clones2[0].x);
        assert_eq!(clones[0].y, clones2[0].y);
        assert_eq!(clones[1].x, clones2[1].x);
        assert_eq!(clones[1].y, clones2[1].y);
        assert_eq!(clones[2].x, clones2[2].x);
        assert_eq!(clones[2].y, clones2[2].y);
        assert_eq!(clones[3].x, clones2[3].x);
        assert_eq!(clones[3].y, clones2[3].y);
    }

    #[test]
    pub fn test_get_distance_squared() {
        let x1: f64 = 0.0;
        let y1: f64 = 0.0;
        let x2: f64 = 1.0;
        let y2: f64 = 2.0;
        let d: f64 = 5.0;
        let d2: f64 = Particle::get_distance_squared(x1, y1, x2, y2);
        assert_eq!(d, d2);
    }

    #[test]
    pub fn test_get_distance() {
        let x1: f64 = 0.0;
        let y1: f64 = 0.0;
        let x2: f64 = -4.0;
        let y2: f64 = 0.0;
        let d: f64 = 4.0;
        let d2: f64 = Particle::get_distance(x1, y1, x2, y2);
        assert_eq!(d, d2);
    }

    #[test]
    pub fn test_particles_collide() {
        //
        let mut p1 = Particle::new(0);
        p1.load_from_json(r#"{
            "x": 1.0,
            "y": 1.0
        }"#.to_string());
        let mut p2 = Particle::new(1);
        p2.load_from_json(r#"{
            "x": 1.0,
            "y": 0.0
        }"#.to_string());
        let mut p3 = Particle::new(3);
        p3.load_from_json(r#"{
            "x": 1.0,
            "y": 0.0,
            "diameter": 1.01
        }"#.to_string());
        assert_eq!(false, Particle::particles_collide(&p1, &p1));
        assert_eq!(false, Particle::particles_collide(&p1, &p2));
        assert_eq!(true, Particle::particles_collide(&p1, &p3));
    }
}
