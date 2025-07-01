import React from "react";

const PreLogo = ({ variant = "image" }) => {
	const tetrahedron = (
		<>
			<style>{`
        @keyframes spin {
          0% {
            transform: rotateZ(90deg) rotateY(0deg);
          }
          100% {
            transform: rotateZ(90deg) rotateY(360deg);
          }
        }
      `}</style>
			<div
				className="relative mx-auto"
				style={{
					perspective: "8em",
					width: "4em",
					height: "3.4641em",
				}}
			>
				<div
					className="absolute rounded-full"
					style={{
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
						width: "1.435em",
						height: "1.435em",
						backgroundColor: "#000",
					}}
				/>
				<div
					className="absolute w-full h-full"
					style={{
						transformStyle: "preserve-3d",
						left: "20%",
						animation: "spin 15s linear infinite",
					}}
				>
					<svg
						viewBox="0 0 400 346.41"
						className="absolute"
						role="img"
						alt="Rotating tetrahedron face"
						aria-label="Rotating tetrahedron face"
						style={{
							width: "4em",
							height: "3.4641em",
							transformOrigin: "center bottom",
							transform: "translateZ(1.1547005em) rotateX(19.471221deg)",
						}}
					>
						<path d="M200,0 L0,346.41 L400,346.41 Z" fill="none" stroke="black" strokeWidth="10" />
					</svg>
					<svg
						viewBox="0 0 400 346.41"
						className="absolute"
						role="img"
						alt="Rotating tetrahedron face"
						aria-label="Rotating tetrahedron face"
						style={{
							width: "4em",
							height: "3.4641em",
							transformOrigin: "center bottom",
							transform: "translateZ(1.1547005em) rotateX(90deg)",
						}}
					>
						<path d="M200,0 L0,346.41 L400,346.41 Z" fill="none" stroke="black" strokeWidth="10" />
					</svg>
					<svg
						viewBox="0 0 400 346.41"
						className="absolute"
						role="img"
						alt="Rotating tetrahedron face"
						aria-label="Rotating tetrahedron face"
						style={{
							width: "4em",
							height: "3.4641em",
							transformOrigin: "center bottom",
							transform: "translateX(-1em) translateZ(-0.57735025em) rotateY(60deg) rotateX(-19.471221deg)",
						}}
					>
						<path d="M200,0 L0,346.41 L400,346.41 Z" fill="none" stroke="black" strokeWidth="10" />
					</svg>
					<svg
						viewBox="0 0 400 346.41"
						className="absolute"
						role="img"
						alt="Rotating tetrahedron face"
						aria-label="Rotating tetrahedron face"
						style={{
							width: "4em",
							height: "3.4641em",
							transformOrigin: "center bottom",
							transform: "translateX(1em) translateZ(-0.57735025em) rotateY(-60deg) rotateX(-19.471221deg)",
						}}
					>
						<path d="M200,0 L0,346.41 L400,346.41 Z" fill="none" stroke="black" strokeWidth="10" />
					</svg>
				</div>
			</div>
		</>
	);

 const wordLogo = <img src="/logo/logo-word.svg" alt="Logo Word" className="w-24" />;

  if (variant === "word") {
    return <div className="flex justify-center items-center">{wordLogo}</div>;
  }

  if (variant === "brand") {
    return (
      <div className="flex items-center space-x-2 gap-2">
        {tetrahedron}
        {wordLogo}
      </div>
    );
  }

    if (variant === "both") {
    return (
      <div className="flex items-center justify-center gap-5">
        <div>{tetrahedron}</div>
        <div>{wordLogo}</div>
      </div>
    );
  }

  return tetrahedron;
};

export default PreLogo;
