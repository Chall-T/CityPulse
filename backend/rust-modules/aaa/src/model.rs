use serde::Deserialize;


#[derive(Debug, Clone, Deserialize)]
pub struct Sticker {
    pub id: String,
    pub file: String,
    pub x: f32,
    pub y: f32,
    pub rotation: f32,
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Deserialize)]
pub struct InputData {
    pub background: String,
    pub stickers: Vec<Sticker>,
}

#[derive(Debug, Clone)]
pub struct Point {
    pub x: f32,
    pub y: f32,
    pub w: f32,
    pub h: f32,
    pub sticker: Sticker,
}

#[derive(Debug, Clone)]
pub struct Rect {
    pub x: f32,
    pub y: f32,
    pub w: f32,
    pub h: f32,
}


#[derive(Debug)]
pub struct Quadtree {
    boundary: Rect,
    capacity: usize,
    points: Vec<Point>,
    divided: bool,
    northeast: Option<Box<Quadtree>>,
    northwest: Option<Box<Quadtree>>,
    southeast: Option<Box<Quadtree>>,
    southwest: Option<Box<Quadtree>>,
}

impl Quadtree {
    pub fn new(boundary: Rect, capacity: usize) -> Self {
        Quadtree {
            boundary,
            capacity,
            points: Vec::new(),
            divided: false,
            northeast: None,
            northwest: None,
            southeast: None,
            southwest: None,
        }
    }

    pub fn subdivide(&mut self) {
        let Rect { x, y, w, h } = self.boundary;
        self.northeast = Some(Box::new(Quadtree::new(
            Rect { x: x + w/2.0, y, w: w/2.0, h: h/2.0 },
            self.capacity,
        )));
        self.northwest = Some(Box::new(Quadtree::new(
            Rect { x, y, w: w/2.0, h: h/2.0 },
            self.capacity,
        )));
        self.southeast = Some(Box::new(Quadtree::new(
            Rect { x: x + w/2.0, y: y + h/2.0, w: w/2.0, h: h/2.0 },
            self.capacity,
        )));
        self.southwest = Some(Box::new(Quadtree::new(
            Rect { x, y: y + h/2.0, w: w/2.0, h: h/2.0 },
            self.capacity,
        )));
        self.divided = true;
    }

    pub fn insert(&mut self, point: Point) -> bool {
        let Rect { x, y, w, h } = self.boundary;
        if point.x > x + w || point.x + point.w < x || point.y > y + h || point.y + point.h < y {
            return false;
        }

        if self.points.len() < self.capacity {
            self.points.push(point);
            return true;
        } else {
            if !self.divided {
                self.subdivide();
            }

            return self.northeast.as_mut().unwrap().insert(point.clone())
                || self.northwest.as_mut().unwrap().insert(point.clone())
                || self.southeast.as_mut().unwrap().insert(point.clone())
                || self.southwest.as_mut().unwrap().insert(point);
        }
    }

    pub fn query(&self, range: &Rect, found: &mut Vec<Point>) {
        let Rect { x, y, w, h } = self.boundary;

        if range.x > x + w || range.x + range.w < x || range.y > y + h || range.y + range.h < y {
            return;
        }

        for p in &self.points {
            if p.x + p.w >= range.x && p.x <= range.x + range.w &&
               p.y + p.h >= range.y && p.y <= range.y + range.h
            {
                found.push(p.clone());
            }
        }

        if self.divided {
            self.northwest.as_ref().unwrap().query(range, found);
            self.northeast.as_ref().unwrap().query(range, found);
            self.southwest.as_ref().unwrap().query(range, found);
            self.southeast.as_ref().unwrap().query(range, found);
        }
    }
}
