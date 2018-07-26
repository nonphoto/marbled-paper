export default function getContext(canvas) {
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')

    if (!gl) {
      throw Error('Unable to initialize WebGL. Maybe your browser doesn\'t support it.')
    }

    return gl
}
