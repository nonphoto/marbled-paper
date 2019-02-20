export default function getPositionInBounds(bounds, position) {
    const [x, y] = position
    const nx = (x - bounds.left) / bounds.width
    const ny = -(y - bounds.bottom) / bounds.height
    return [nx, ny]
}
