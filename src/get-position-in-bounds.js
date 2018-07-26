export default function getPositionInBounds(bounds, position) {
    const [x, y] = position
    const nx = x - bounds.left
    const ny = -(y - bounds.bottom)
    return [nx, ny]
}
