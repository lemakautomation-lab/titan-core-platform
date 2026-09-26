# TITAN Health performance body visual direction

The four generated adult athlete images are approved visual references for male and female front and rear views. They were generated for this project from original descriptive prompts, with no stock photograph, third-party 3D model, or uploaded anatomy reference copied into the product. Facial features in the front views are blurred; rear views show no face. They are 2D concept assets and are not a 3D model. Do not present them as a rotating body or infer precise anatomical measurements from pixels.

The existing interactive Three.js mannequin remains a placeholder until original production-quality male and female 3D meshes are authored, supplied with provenance and commercial-use rights, mapped to consistent anatomical regions, and integrated with existing controls. No third-party model is cleared by this document.

The current database holds height, weight, server-calculated BMI, optional whole-body fat percentage, and timestamped history. The Athlete can append values through the self-service POST route. BMI is not an input and does not identify muscle, fat mass, or regional fat distribution. The frontend measurement form uses this existing boundary and reloads the authenticated Athlete profile. It must not colour individual muscles or fat regions based on BMI, weight, or whole-body fat percentage alone.

For regional progress, add explicit source-attributed regional circumference, skinfold, scan, or professionally assessed measurements with units, method, dates, and tenant-scoped athlete ownership. Define separate muscle and fat visualization mappings with baseline/current comparisons, missing-data states, and validation before turning on region overlays. Clinical or diagnostic claims are outside this staging feature.

Staging approval of images is visual direction only. The live 3D feature and regional progress remain open.
