# RIPPLE: Reaction-Diffusion Condensation Explorer

The **RIPPLE**  Reaction-Diffusion Condensation Explorer is a WebGL-accelerated simulation environment for exploring the intersection of a reaction-diffusion model (Gray-Scott)  with different condensation and phase-separation effects. It provides a conceptual model associated with the experimental work from our recent publication "Reaction-diffusion-condensation generates a landscape of self-organizing sub-cellular structures".

This model allows the user to flexibly extend the classic Gray-Scott model with the following effects:

- **Phase-separation effects**: Spatial coupling between species gradients that induces "tug-of-war" advection.
- **Condensation effects on RD diffusion**:  concentration-sensitive changes to diffusion rates ($\alpha, \beta, \gamma, \delta$ parameters).
- **Condensation effects on RD reactivity **: concentration-sensitive changes to the feed and kill rates
- **Thermal Noise**

## Features

- **High-Performance Shaders**: GPGPU simulation running at 36 steps per frame for smooth real-time interaction.
- **Interactive UI**: Real-time control over all simulation parameters.
- **Multi-resolution Support**: From 256px for speed up to 2048px for high-fidelity exports.
- **Reflective Boundaries**: Toggle between toroidal (fract) and reflective (mirror) boundary conditions.
- **9-Point Laplacian**: Higher precision spatial derivative calculations.
- **Exporting**: Save high-resolution PNG snapshots of experimental states.

