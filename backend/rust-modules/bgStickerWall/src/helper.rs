#[derive(Clone, Copy, Debug)]
pub struct Rect {
    pub x: f32,
    pub y: f32,
    pub w: f32,
    pub h: f32,
}

impl Rect {
    pub fn area(&self) -> f32 {
        self.w * self.h
    }

    pub fn overlap(&self, other: &Rect) -> f32 {
        let x1 = self.x.max(other.x);
        let y1 = self.y.max(other.y);
        let x2 = (self.x + self.w).min(other.x + other.w);
        let y2 = (self.y + self.h).min(other.y + other.h);
        if x2 > x1 && y2 > y1 {
            (x2 - x1) * (y2 - y1)
        } else {
            0.0
        }
    }

    pub fn aabb_with_rotation(x: f32, y: f32, w: f32, h: f32, rotation_deg: f32) -> Self {
        if rotation_deg.abs() < 1.0 {
            return Rect { x, y, w, h };
        }
        let theta = rotation_deg.to_radians();
        let cos_t = theta.cos().abs();
        let sin_t = theta.sin().abs();
        let new_w = w * cos_t + h * sin_t;
        let new_h = w * sin_t + h * cos_t;
        Rect {
            x: x - (new_w - w) / 2.0,
            y: y - (new_h - h) / 2.0,
            w: new_w,
            h: new_h,
        }
    }
}
