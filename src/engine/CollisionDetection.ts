import { GameObject, Position, Size } from '../types/GameTypes';

export class CollisionDetection {
  /**
   * Check if two game objects are colliding using AABB (Axis-Aligned Bounding Box) collision detection
   */
  public checkCollision(obj1: GameObject, obj2: GameObject): boolean {
    if (!obj1.isActive || !obj2.isActive) {
      return false;
    }

    return this.checkAABBCollision(
      obj1.position,
      obj1.size,
      obj2.position,
      obj2.size
    );
  }

  /**
   * AABB collision detection
   */
  private checkAABBCollision(
    pos1: Position,
    size1: Size,
    pos2: Position,
    size2: Size
  ): boolean {
    const left1 = pos1.x - size1.width / 2;
    const right1 = pos1.x + size1.width / 2;
    const top1 = pos1.y - size1.height / 2;
    const bottom1 = pos1.y + size1.height / 2;

    const left2 = pos2.x - size2.width / 2;
    const right2 = pos2.x + size2.width / 2;
    const top2 = pos2.y - size2.height / 2;
    const bottom2 = pos2.y + size2.height / 2;

    return (
      left1 < right2 &&
      right1 > left2 &&
      top1 < bottom2 &&
      bottom1 > top2
    );
  }

  /**
   * Check if a point is inside a game object
   */
  public checkPointCollision(point: Position, obj: GameObject): boolean {
    if (!obj.isActive) {
      return false;
    }

    const left = obj.position.x - obj.size.width / 2;
    const right = obj.position.x + obj.size.width / 2;
    const top = obj.position.y - obj.size.height / 2;
    const bottom = obj.position.y + obj.size.height / 2;

    return (
      point.x >= left &&
      point.x <= right &&
      point.y >= top &&
      point.y <= bottom
    );
  }

  /**
   * Check circular collision (useful for explosions or special effects)
   */
  public checkCircularCollision(
    pos1: Position,
    radius1: number,
    pos2: Position,
    radius2: number
  ): boolean {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance < (radius1 + radius2);
  }

  /**
   * Get the distance between two game objects
   */
  public getDistance(obj1: GameObject, obj2: GameObject): number {
    const dx = obj1.position.x - obj2.position.x;
    const dy = obj1.position.y - obj2.position.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Check if an object is within screen bounds
   */
  public isWithinBounds(
    obj: GameObject,
    screenWidth: number,
    screenHeight: number,
    margin: number = 50
  ): boolean {
    return (
      obj.position.x > -margin &&
      obj.position.x < screenWidth + margin &&
      obj.position.y > -margin &&
      obj.position.y < screenHeight + margin
    );
  }

  /**
   * Get all objects within a certain radius of a position
   */
  public getObjectsInRadius<T extends GameObject>(
    objects: T[],
    center: Position,
    radius: number
  ): T[] {
    return objects.filter(obj => {
      if (!obj.isActive) return false;
      
      const distance = this.getDistance(
        { position: center } as GameObject,
        obj
      );
      return distance <= radius;
    });
  }

  /**
   * Check line of sight between two objects (useful for AI)
   */
  public hasLineOfSight(
    obj1: GameObject,
    obj2: GameObject,
    obstacles: GameObject[]
  ): boolean {
    // Simple line of sight check - can be enhanced with ray casting
    for (const obstacle of obstacles) {
      if (obstacle === obj1 || obstacle === obj2 || !obstacle.isActive) {
        continue;
      }

      if (this.lineIntersectsRect(
        obj1.position,
        obj2.position,
        obstacle.position,
        obstacle.size
      )) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if a line intersects with a rectangle
   */
  private lineIntersectsRect(
    lineStart: Position,
    lineEnd: Position,
    rectPos: Position,
    rectSize: Size
  ): boolean {
    const left = rectPos.x - rectSize.width / 2;
    const right = rectPos.x + rectSize.width / 2;
    const top = rectPos.y - rectSize.height / 2;
    const bottom = rectPos.y + rectSize.height / 2;

    // Check if line intersects any of the four sides of the rectangle
    return (
      this.lineIntersectsLine(lineStart, lineEnd, { x: left, y: top }, { x: right, y: top }) ||
      this.lineIntersectsLine(lineStart, lineEnd, { x: right, y: top }, { x: right, y: bottom }) ||
      this.lineIntersectsLine(lineStart, lineEnd, { x: right, y: bottom }, { x: left, y: bottom }) ||
      this.lineIntersectsLine(lineStart, lineEnd, { x: left, y: bottom }, { x: left, y: top })
    );
  }

  /**
   * Check if two lines intersect
   */
  private lineIntersectsLine(
    line1Start: Position,
    line1End: Position,
    line2Start: Position,
    line2End: Position
  ): boolean {
    const denom = (line2End.y - line2Start.y) * (line1End.x - line1Start.x) -
                  (line2End.x - line2Start.x) * (line1End.y - line1Start.y);
    
    if (denom === 0) {
      return false; // Lines are parallel
    }

    const ua = ((line2End.x - line2Start.x) * (line1Start.y - line2Start.y) -
                (line2End.y - line2Start.y) * (line1Start.x - line2Start.x)) / denom;
    
    const ub = ((line1End.x - line1Start.x) * (line1Start.y - line2Start.y) -
                (line1End.y - line1Start.y) * (line1Start.x - line2Start.x)) / denom;

    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
  }
}