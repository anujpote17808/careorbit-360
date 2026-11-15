import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  Pill,
  CalendarDays,
  Users,
  BarChart3,
  Bell,
  Heart,
  RotateCw,
  Sliders,
} from "lucide-react";
import type { TabType } from "./Sidebar";

export interface OrbitNodeData {
  id: TabType;
  title: string;
  subtitle: string;
  badge: string;
  color: string;
  lightColor: string;
  icon: typeof Pill;
  orbitRadius: number;
  orbitSpeed: number;
  orbitAngle: number;
  yOffset: number;
  pulseSpeed: number;
}

interface CareOrbitCanvasProps {
  onSelectNode?: (tab: TabType) => void;
  patientName?: string;
  adherenceRate?: number;
  activeMedsCount?: number;
  nextAppointmentStr?: string;
  caregiversCount?: number;
  unreadAlertsCount?: number;
  variant?: "hero" | "fullscreen" | "landing";
  className?: string;
}

export default function CareOrbitCanvas({
  onSelectNode,
  patientName = "Eleanor Vance",
  adherenceRate = 100,
  activeMedsCount = 4,
  nextAppointmentStr = "Cardiology — Nov 18",
  caregiversCount = 2,
  unreadAlertsCount = 1,
  variant = "hero",
  className = "",
}: CareOrbitCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<OrbitNodeData | null>(null);
  const [use2DFallback, setUse2DFallback] = useState(false);
  const [isRotating, setIsRotating] = useState(true);

  // Nodes definition with live metrics
  const nodes: OrbitNodeData[] = [
    {
      id: "medications",
      title: "Medications",
      subtitle: `${activeMedsCount} active prescriptions`,
      badge: "On Schedule",
      color: "#10b981",
      lightColor: "#6ee7b7",
      icon: Pill,
      orbitRadius: 4.8,
      orbitSpeed: 0.45,
      orbitAngle: 0.2,
      yOffset: 0.3,
      pulseSpeed: 1.2,
    },
    {
      id: "appointments",
      title: "Appointments",
      subtitle: nextAppointmentStr,
      badge: "Upcoming",
      color: "#0284c7",
      lightColor: "#7dd3fc",
      icon: CalendarDays,
      orbitRadius: 7.2,
      orbitSpeed: 0.32,
      orbitAngle: 2.1,
      yOffset: -0.6,
      pulseSpeed: 0.9,
    },
    {
      id: "caregivers",
      title: "Care Circle",
      subtitle: `${caregiversCount} family & caregivers active`,
      badge: "Connected",
      color: "#8b5cf6",
      lightColor: "#c4b5fd",
      icon: Users,
      orbitRadius: 9.4,
      orbitSpeed: 0.25,
      orbitAngle: 3.8,
      yOffset: 0.8,
      pulseSpeed: 1.0,
    },
    {
      id: "reports",
      title: "Adherence",
      subtitle: `${adherenceRate}% 7-day adherence score`,
      badge: adherenceRate >= 80 ? "Optimal" : "Needs Attention",
      color: "#14b8a6",
      lightColor: "#5eead4",
      icon: BarChart3,
      orbitRadius: 11.6,
      orbitSpeed: 0.2,
      orbitAngle: 5.2,
      yOffset: -0.4,
      pulseSpeed: 1.5,
    },
    {
      id: "notifications",
      title: "Alerts & SOS",
      subtitle: `${unreadAlertsCount} unread update • SOS Active`,
      badge: "Monitored",
      color: "#f43f5e",
      lightColor: "#fda4af",
      icon: Bell,
      orbitRadius: 13.8,
      orbitSpeed: 0.16,
      orbitAngle: 1.1,
      yOffset: 0.5,
      pulseSpeed: 2.0,
    },
  ];

  // Check WebGL availability
  useEffect(() => {
    try {
      const testCanvas = document.createElement("canvas");
      const gl =
        testCanvas.getContext("webgl") ||
        testCanvas.getContext("experimental-webgl");
      if (!gl) {
        setUse2DFallback(true);
      }
    } catch {
      setUse2DFallback(true);
    }
  }, []);

  // WebGL 3D Scene Initialization
  useEffect(() => {
    if (use2DFallback || !canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;

    let width = container.clientWidth || 600;
    let height = container.clientHeight || 400;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a1f1b, 0.025);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 14, 22);
    camera.lookAt(0, 0, 0);

    // 2. Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
    } catch (err) {
      console.warn("WebGL initialization failed, falling back to 2D view:", err);
      setUse2DFallback(true);
      return;
    }

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0x7ce0bf, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(10, 25, 15);
    scene.add(dirLight);

    const centralLight = new THREE.PointLight(0x38ef7d, 3.5, 30);
    centralLight.position.set(0, 0, 0);
    scene.add(centralLight);

    // 4. Central Patient Core Node
    const patientCoreGroup = new THREE.Group();
    scene.add(patientCoreGroup);

    // Glowing core sphere
    const coreGeometry = new THREE.SphereGeometry(1.6, 32, 32);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0x115e59,
      emissive: 0x0f766e,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8,
    });
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    patientCoreGroup.add(coreMesh);

    // Outer wireframe pulsating aura
    const haloGeometry = new THREE.SphereGeometry(2.1, 24, 24);
    const haloMaterial = new THREE.MeshBasicMaterial({
      color: 0x5eead4,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const haloMesh = new THREE.Mesh(haloGeometry, haloMaterial);
    patientCoreGroup.add(haloMesh);

    // 5. Orbit Rings & Orbiting Nodes
    const orbitMeshes: Array<{
      mesh: THREE.Mesh;
      glow: THREE.Mesh;
      nodeData: OrbitNodeData;
      currentAngle: number;
    }> = [];

    nodes.forEach((n) => {
      // Draw circular orbital guide ring
      const ringCurve = new THREE.EllipseCurve(
        0,
        0,
        n.orbitRadius,
        n.orbitRadius,
        0,
        2 * Math.PI,
        false,
        0
      );
      const points = ringCurve.getPoints(90);
      const ringGeo = new THREE.BufferGeometry().setFromPoints(
        points.map((p) => new THREE.Vector3(p.x, n.yOffset, p.y))
      );
      const ringMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(n.color),
        transparent: true,
        opacity: 0.22,
      });
      const ringLine = new THREE.Line(ringGeo, ringMat);
      scene.add(ringLine);

      // Node mesh
      const nodeGeo = new THREE.SphereGeometry(0.75, 24, 24);
      const nodeMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(n.color),
        emissive: new THREE.Color(n.color),
        emissiveIntensity: 0.5,
        roughness: 0.3,
        metalness: 0.7,
      });
      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeMesh.userData = { nodeData: n };

      // Glow halo
      const glowGeo = new THREE.SphereGeometry(1.05, 16, 16);
      const glowMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(n.lightColor),
        wireframe: true,
        transparent: true,
        opacity: 0.4,
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      nodeMesh.add(glowMesh);

      scene.add(nodeMesh);

      orbitMeshes.push({
        mesh: nodeMesh,
        glow: glowMesh,
        nodeData: n,
        currentAngle: n.orbitAngle,
      });
    });

    // 6. Ambient Stardust Particles
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 36;
      particlePositions[i + 1] = (Math.random() - 0.5) * 16;
      particlePositions[i + 2] = (Math.random() - 0.5) * 36;
    }
    particleGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3)
    );
    const particleMat = new THREE.PointsMaterial({
      color: 0x7ce0bf,
      size: 0.15,
      transparent: true,
      opacity: 0.55,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 7. Raycasting & Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-100, -100);

    const onPointerMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onClick = () => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(
        orbitMeshes.map((m) => m.mesh)
      );
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const nodeData = hit.userData.nodeData as OrbitNodeData;
        if (nodeData && onSelectNode) {
          onSelectNode(nodeData.id);
        }
      }
    };

    canvas.addEventListener("mousemove", onPointerMove);
    canvas.addEventListener("click", onClick);

    // 8. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Rotate patient core
      coreMesh.rotation.y += 0.008;
      haloMesh.rotation.y -= 0.005;
      haloMesh.rotation.x = Math.sin(elapsedTime * 0.8) * 0.15;
      const corePulse = 1 + Math.sin(elapsedTime * 2) * 0.04;
      haloMesh.scale.set(corePulse, corePulse, corePulse);

      // Rotate particles
      particles.rotation.y += 0.0006;

      // Raycast hover check
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(
        orbitMeshes.map((m) => m.mesh)
      );

      let foundHover: OrbitNodeData | null = null;
      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        foundHover = hitMesh.userData.nodeData as OrbitNodeData;
      }
      setHoveredNode(foundHover);

      // Update Orbiting Nodes Position
      orbitMeshes.forEach((item) => {
        const { mesh, glow, nodeData } = item;
        const isHovered = foundHover?.id === nodeData.id;

        // Advance orbital angle if rotating
        if (isRotating && !isHovered) {
          item.currentAngle += nodeData.orbitSpeed * delta * 0.8;
        }

        const angle = item.currentAngle;
        const radius = nodeData.orbitRadius;
        const targetX = Math.cos(angle) * radius;
        const targetZ = Math.sin(angle) * radius;
        const targetY =
          nodeData.yOffset +
          Math.sin(elapsedTime * nodeData.pulseSpeed + angle) * 0.3;

        mesh.position.set(targetX, targetY, targetZ);
        mesh.rotation.y += 0.02;

        // Hover scale animation
        const targetScale = isHovered ? 1.4 : 1.0;
        mesh.scale.lerp(
          new THREE.Vector3(targetScale, targetScale, targetScale),
          0.15
        );
        glow.rotation.y += 0.03;
      });

      // Smooth camera subtle float
      camera.position.x = Math.sin(elapsedTime * 0.15) * 1.5;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize Handling
    const handleResize = () => {
      if (!containerRef.current || !renderer) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      canvas.removeEventListener("mousemove", onPointerMove);
      canvas.removeEventListener("click", onClick);
      renderer.dispose();
    };
  }, [use2DFallback, isRotating, onSelectNode]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden select-none ${
        variant === "fullscreen"
          ? "h-[620px] rounded-3xl"
          : variant === "landing"
          ? "h-[480px] sm:h-[540px] rounded-3xl"
          : "h-[360px] sm:h-[400px] rounded-3xl"
      } bg-gradient-to-b from-[#0a231d] via-[#0d2a23] to-[#071713] border border-teal-900/50 shadow-2xl ${className}`}
    >
      {/* 3D WebGL Canvas */}
      {!use2DFallback ? (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full cursor-pointer touch-none"
        />
      ) : (
        /* 2D Accessible SVG Orbit Fallback */
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <svg className="w-full h-full max-w-lg" viewBox="0 0 400 400">
            {/* Concentric rings */}
            <circle
              cx="200"
              cy="200"
              r="60"
              fill="none"
              stroke="#14b8a6"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.3"
            />
            <circle
              cx="200"
              cy="200"
              r="100"
              fill="none"
              stroke="#0284c7"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.3"
            />
            <circle
              cx="200"
              cy="200"
              r="140"
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.3"
            />
            <circle
              cx="200"
              cy="200"
              r="175"
              fill="none"
              stroke="#f43f5e"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.3"
            />

            {/* Central Patient Node */}
            <g transform="translate(200, 200)">
              <circle r="34" fill="#0f766e" filter="drop-shadow(0 0 12px #2dd4bf)" />
              <circle r="28" fill="#134e4a" />
              <text
                textAnchor="middle"
                dy="4"
                fill="#ffffff"
                fontSize="11"
                fontWeight="bold"
              >
                PATIENT
              </text>
            </g>

            {/* Orbiting 2D Nodes */}
            {nodes.map((n, i) => {
              const angle = (i * (2 * Math.PI)) / nodes.length - Math.PI / 2;
              const r = 50 + i * 30;
              const x = 200 + Math.cos(angle) * r;
              const y = 200 + Math.sin(angle) * r;

              return (
                <g
                  key={n.id}
                  transform={`translate(${x}, ${y})`}
                  className="cursor-pointer transition-transform hover:scale-125"
                  onClick={() => onSelectNode && onSelectNode(n.id)}
                  onMouseEnter={() => setHoveredNode(n)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  <circle r="20" fill={n.color} filter="drop-shadow(0 0 8px rgba(0,0,0,0.4))" />
                  <circle r="22" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.4" />
                  <text
                    textAnchor="middle"
                    dy="4"
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="bold"
                  >
                    {n.title.slice(0, 3).toUpperCase()}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {/* Top Overlay Badge & Controls */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/80 px-3.5 py-1.5 text-xs font-bold text-teal-300 backdrop-blur-md border border-teal-500/20 shadow-lg pointer-events-auto">
          <span className="flex h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
          <span className="tracking-wide">Care Orbit 360™ Ecosystem</span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {/* 2D / 3D Mode Toggle */}
          <button
            type="button"
            onClick={() => setUse2DFallback(!use2DFallback)}
            className="flex items-center gap-1.5 rounded-full bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white border border-teal-500/20 backdrop-blur-md shadow-md transition"
            title="Toggle between 3D WebGL and accessible 2D view"
          >
            <Sliders size={13} />
            <span>{use2DFallback ? "3D View" : "2D View"}</span>
          </button>

          {/* Pause / Resume Rotation */}
          {!use2DFallback && (
            <button
              type="button"
              onClick={() => setIsRotating(!isRotating)}
              className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-900/80 text-slate-300 hover:text-white border border-teal-500/20 backdrop-blur-md shadow-md transition"
              title={isRotating ? "Pause Orbit" : "Resume Orbit"}
            >
              <RotateCw size={13} className={isRotating ? "animate-spin" : ""} />
            </button>
          )}
        </div>
      </div>

      {/* Center Label (Mobile / Context) */}
      <div className="absolute bottom-4 left-4 pointer-events-none">
        <div className="rounded-2xl bg-slate-950/70 p-3 backdrop-blur-md border border-teal-800/40 text-xs">
          <p className="font-extrabold text-white flex items-center gap-1.5">
            <Heart size={14} className="text-teal-400" fill="#2dd4bf" />
            <span>{patientName}</span>
          </p>
          <p className="text-slate-400 mt-0.5 text-[11px]">
            {adherenceRate}% Adherence • All care nodes active
          </p>
        </div>
      </div>

      {/* Interactive Floating Hover HUD Card */}
      {hoveredNode && (
        <div className="absolute bottom-4 right-4 max-w-xs animate-in fade-in zoom-in-95 duration-150 pointer-events-auto">
          <div
            className="rounded-2xl p-4 backdrop-blur-xl border shadow-2xl transition"
            style={{
              backgroundColor: "rgba(10, 35, 29, 0.92)",
              borderColor: hoveredNode.color,
              boxShadow: `0 10px 25px -5px ${hoveredNode.color}40`,
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-white"
                  style={{ backgroundColor: hoveredNode.color }}
                >
                  <hoveredNode.icon size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white">
                    {hoveredNode.title}
                  </h4>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300">
                    {hoveredNode.badge}
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-2 text-xs text-slate-300 font-medium">
              {hoveredNode.subtitle}
            </p>

            {onSelectNode && (
              <button
                type="button"
                onClick={() => onSelectNode(hoveredNode.id)}
                className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-xl py-1.5 px-3 text-xs font-bold text-white transition hover:opacity-90 shadow-md"
                style={{ backgroundColor: hoveredNode.color }}
              >
                <span>Explore {hoveredNode.title}</span>
                <span>→</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Orbit Interaction Hint */}
      {!hoveredNode && (
        <div className="absolute bottom-4 right-4 pointer-events-none hidden sm:block">
          <div className="rounded-full bg-slate-900/60 px-3.5 py-1 text-[11px] font-medium text-slate-400 backdrop-blur-sm border border-slate-700/40">
            Hover or click any care node to inspect
          </div>
        </div>
      )}
    </div>
  );
}
