# RIPPLE: Reaction-Diffusion Condensation Explorer

**RIPPLE** (**R**eaction-diffusion with **I**nter-species **P**ressure, **P**ressure-**L**ayreing and **E**ntrainment) is an advanced WebGL-accelerated simulation environment for exploring the intersection of Gray-Scott reaction-diffusion models with condensation and advection effects.

Developed for research in pattern formation and morphogenetic engineering, RIPPLE extends the classic Gray-Scott model with several novel mechanisms:

- **Advective Tugging**: Spatial coupling between species gradients that induces "tug-of-war" advection.
- **Variable Viscosity/Diffusivity**: Local concentration-dependent diffusion rates ($\alpha, \beta, \gamma, \delta$ parameters).
- **Metabolic Gating**: Dynamic feedback on the feed rate ($F$) based on activator thresholds, simulating resource exhaustion.
- **Thermal Noise**: Stochastic perturbations to investigate system stability.

## Features

- **High-Performance Shaders**: GPGPU simulation running at 36 steps per frame for smooth real-time interaction.
- **Interactive UI**: Real-time control over all simulation parameters.
- **Multi-resolution Support**: From 256px for speed up to 2048px for high-fidelity exports.
- **Reflective Boundaries**: Toggle between toroidal (fract) and reflective (mirror) boundary conditions.
- **9-Point Laplacian**: Higher precision spatial derivative calculations.
- **Exporting**: Save high-resolution PNG snapshots of experimental states.

## Getting Started

Simply open `index.html` in any modern web browser that supports WebGL. 

*Note: Due to the use of ES6 Modules and shader fetching, you may need to run this through a local web server (e.g., `python -m http.server`, `npx serve`, or Live Server in VS Code) to avoid CORS issues when loading external files.*

## Model Parameters

### Gray-Scott Core
- **Feed (F)**: Rate at which substrate $U$ is added to the system.
- **Kill (k)**: Rate at which activator $V$ is removed.
- **Diff U/V**: Diffusion coefficients for both species.

### Condensation & Advection
- **$\alpha, \beta, \gamma, \delta$**: Concentration-dependent diffusion modifiers.
- **$K_{uu}, K_{vv}$**: Self-advection (tugging) coefficients.
- **$K_{vu}, K_{uv}$**: Cross-advection coefficients.

### Metabolic Gate
- **Critical V ($C_{crit}$)**: The concentration threshold of $V$ that triggers metabolic stress.
- **Starvation Pwr**: The intensity of the feed rate reduction when under stress.

## License

This project is released under the MIT License. If using this simulation in academic work, please cite the accompanying paper.
