!function(e, r, t) {
    "use strict";
    var i = "uniform sampler2D texture;\r\nuniform vec2 res;\r\nvoid main() {\r\n\tvec2 uv = gl_FragCoord.xy / res;\r\n\tgl_FragColor = texture2D( texture, uv );\r\n}"
      , n = "void main() {\r\n    gl_Position = vec4( position, 1.0 );\r\n}"
      , a = "int uvToIndex(vec2 uv, vec2 size) {\r\n\tivec2 coord = ivec2(floor(uv*size+0.5));\r\n\treturn coord.x + int(floor(size.x)) * coord.y;\r\n}\r\n\r\nvec2 indexToUV(float index, vec2 res){\r\n\tvec2 uv = vec2(mod(index/res.x,1.0), floor( index/res.y ) / res.x);\r\n\treturn uv;\r\n}\r\n\r\n// Get grid position as a vector: (xIndex, yIndex)\r\nvec2 worldPosToGridPos(vec2 particlePos, vec2 gridPos, vec2 cellSize){\r\n\treturn floor((particlePos - gridPos)/cellSize);\r\n}\r\n\r\n// Convert grid position to UV coord in the grid texture\r\nvec2 gridPosToGridUV(vec2 gridPos, int subIndex, vec2 gridRes, vec2 gridTextureRes){\r\n\tgridPos = clamp(gridPos, vec2(0), gridRes-vec2(1)); // Keep within limits\r\n\r\n\tvec2 gridUV = gridPos / gridRes;\r\n\r\n\t// Choose sub pixel\r\n\tfloat fSubIndex = float(subIndex);\r\n\tgridUV += vec2( mod(fSubIndex,2.0), floor(fSubIndex/2.0) ) / gridTextureRes;\r\n\r\n\treturn gridUV;\r\n}\r\n\r\nfloat isInsideGrid(vec2 position, vec2 gridPos, vec2 gridRes, vec2 cellSize){\r\n\tvec2 shrink = vec2(0.02);\r\n\t// vec2 isInside = step(gridPos+shrink, position) * (1.0-step(gridPos+gridRes*cellSize-shrink, position));\r\n\tvec2 isInside = smoothstep(gridPos+shrink,gridPos+2.0*shrink, position) * (1.0-smoothstep(gridPos+gridRes*cellSize-2.0*shrink,gridPos+gridRes*cellSize-shrink, position));\r\n\treturn isInside.x * isInside.y;\r\n}\r\n\r\nvec2 isInsideGrid3(vec2 position, vec2 gridPos, vec2 gridRes, vec2 cellSize, vec2 margin){\r\n\tvec2 isInside = smoothstep(gridPos+margin,gridPos+2.0*margin, position) * (1.0-smoothstep(gridPos+gridRes*cellSize-2.0*margin,gridPos+gridRes*cellSize-margin, position));\r\n\treturn isInside;\r\n}\r\n";
    function o(r) {
        this.position = new e.Vector2(0,0),
        this.resolution = new e.Vector2(64,64),
        this.update()
    }
    Object.assign(o.prototype, {
        update: function() {}
    });
    var s, l = (s = new Set,
    function(e) {
        s.has(e) || (console.warn(e),
        s.add(e))
    }
    );
    function c(r) {
        r = r || {};
        var t = this.params1 = new e.Vector4(void 0 !== r.stiffness ? r.stiffness : 1700,void 0 !== r.damping ? r.damping : 6,void 0 !== r.radius ? r.radius : .5,1e6)
          , a = this.params2 = new e.Vector4(void 0 !== r.fixedTimeStep ? r.fixedTimeStep : 1 / 120,void 0 !== r.friction ? r.friction : 2,void 0 !== r.drag ? r.drag : .1,void 0 !== r.centerParticleIndex ? r.centerParticleIndex : -1);
        this.params3 = new e.Vector4(10,10,10,1);
        this.params4 = new e.Vector4(0,0,0,0),
        this.applyTorqueMaskAndCenterParticleId = new e.Vector4,
        this.onpoststep = r.onpoststep || function() {}
        ,
        this.time = 0,
        this.fixedTime = 0,
        this.broadphase = new o,
        this.gravity = new e.Vector2(0,0),
        r.gravity && this.gravity.copy(r.gravity),
        this.boxMin = new e.Vector2(-1e4,-1e4),
        this.boxMax = new e.Vector2(1e4,1e4),
        r.boxMin && this.boxMin.copy(r.boxMin),
        r.boxMax && this.boxMax.copy(r.boxMax),
        r.gridPosition && this.broadphase.position.copy(r.gridPosition),
        r.gridResolution && this.broadphase.resolution.copy(r.gridResolution),
        this.broadphase.update(),
        this.materials = {},
        this.textures = {},
        this.dataTextures = {},
        this.scenes = {},
        this.renderer = r.renderer,
        this.particleCount = 0,
        this.massDirty = !0,
        this.maxTrackedParticles = 16,
        this.particleTrackedIndices = new Float32Array(this.maxTrackedParticles),
        this.trackedParticleData = new Float32Array(4 * this.maxTrackedParticles),
        this.applyGravityMask = new e.Vector4(0,0,0,0),
        this.applyForceMask = new e.Vector4(0,0,0,0),
        this.applyForce = new e.Vector2(0,0),
        this.applyForceMask2 = new e.Vector4(0,0,0,0),
        this.applyForce2 = new e.Vector2(0,0),
        this.maxSubSteps = void 0 !== r.maxSubSteps ? r.maxSubSteps : 5,
        this.accumulator = 0,
        this.interpolationValue = 0;
        var s = this;
        function l() {
            var e = 2 * s.radius / s.fixedTimeStep;
            s.params1.w = e
        }
        Object.defineProperties(this, {
            radius: {
                get: function() {
                    return t.z
                },
                set: function(e) {
                    t.z = e,
                    l()
                }
            },
            fixedTimeStep: {
                get: function() {
                    return a.x
                },
                set: function(e) {
                    a.x = e,
                    l()
                }
            },
            stiffness: {
                get: function() {
                    return t.x
                },
                set: function(e) {
                    t.x = e
                }
            },
            damping: {
                get: function() {
                    return t.y
                },
                set: function(e) {
                    t.y = e
                }
            },
            friction: {
                get: function() {
                    return a.y
                },
                set: function(e) {
                    a.y = e
                }
            },
            drag: {
                get: function() {
                    return a.z
                },
                set: function(e) {
                    a.z = e
                }
            },
            centerParticleIndex: {
                get: function() {
                    return a.w
                },
                set: function(e) {
                    a.w = e
                }
            },
            maxParticles: {
                get: function() {
                    return Math.pow(this.textures.particleRead.width, 2)
                }
            },
            particleMassTexture: {
                get: function() {
                    return this.dataTextures.mass.texture
                }
            },
            particleTexture: {
                get: function() {
                    return this.textures.particleRead.texture
                }
            },
            particleTexturePrevious: {
                get: function() {
                    return this.textures.particleWrite.texture
                }
            },
            particleTextureSize: {
                get: function() {
                    return this.textures.particleRead.width
                }
            },
            gridTexture: {
                get: function() {
                    return this.textures.grid.texture
                }
            },
            gridTextureSize: {
                get: function() {
                    return this.textures.grid.width
                }
            }
        }),
        l(),
        this.initTextures(r.maxParticles || 8),
        Object.assign(this.materials, {
            textured: new e.ShaderMaterial({
                uniforms: {
                    texture: {
                        value: null
                    },
                    res: {
                        value: new e.Vector2
                    }
                },
                vertexShader: n,
                fragmentShader: i
            })
        }),
        this.scenes.fullscreen = new e.Scene,
        this.fullscreenCamera = new e.Camera;
        var c = new e.PlaneBufferGeometry(2,2)
          , d = this.fullscreenQuad = new e.Mesh(c,this.materials.textured);
        this.scenes.fullscreen.add(d),
        this.cellSize = new e.Vector2(this.radius,this.radius).multiplyScalar(2)
    }
    function d(e, r, t) {
        return e % r
    }
    function u(e, r, t) {
        return Math.floor(e / t)
    }
    function p(e, r, t) {
        var i = d(e, r);
        return 4 * (u(e, 0, t) * r + i)
    }
    function m(e) {
        if (e.isVector2)
            return "vec2(" + e.x + "," + e.y + ")";
        if (e.isVector3)
            return "vec3(" + e.x + "," + e.y + "," + e.z + ")";
        throw new Error("vector convert fail")
    }
    function x(r, t, i, n) {
        return new e.WebGLRenderTarget(r,t,{
            minFilter: e.NearestFilter,
            magFilter: e.NearestFilter,
            format: void 0 === n ? e.RGBAFormat : n,
            type: i
        })
    }
    function f(e, r, t) {
        return Math.min(Math.max(e, r), t)
    }
    function v(e, r) {
        return (e / r * 100).toFixed(1)
    }
    Object.assign(c.prototype, {
        getDefines: function(r) {
            var t = this.broadphase.resolution
              , i = this.textures.grid;
            return Object.assign({}, r || {}, {
                resolution: m(new e.Vector2(this.particleTextureSize,this.particleTextureSize)),
                gridResolution: m(t),
                gridTextureResolution: m(new e.Vector2(i.width,i.height)),
                MAX_TRACKED_PARTICLES: "16.0"
            })
        },
        step: function(e) {
            var r = this.accumulator
              , t = this.fixedTimeStep;
            if (!(e < 0 || t <= 0)) {
                r += e;
                for (var i = 0; r >= t; )
                    i < this.maxSubSteps && this.singleStep(),
                    r -= t,
                    i++;
                this.interpolationValue = r / t,
                this.accumulator = r
            }
        },
        singleStep: function() {
            this.saveRendererState(),
            this.flushData(),
            this.updateGrid(),
            this.updateParticles(),
            this.updateExplodeParticle(),
            this.updateExplodedParticle(),
            this.tearSprings(),
            this.addExplodeForce(),
            this.restoreRendererState(),
            this.fixedTime += this.fixedTimeStep,
            this.time += this.fixedTimeStep,
            this.onpoststep()
        },
        addParticle: function(e, r, t, i, n) {
            if (!(this.particleCount >= this.maxParticles)) {
                var a = this.dataTextures.particles
                  , o = p(this.particleCount, a.image.width, a.image.height);
                a.needsUpdate = !0;
                var s = a.image.data;
                s[o + 0] = e,
                s[o + 1] = r,
                s[o + 2] = 0,
                s[o + 3] = 0,
                (a = this.dataTextures.mass).needsUpdate = !0,
                (s = a.image.data)[o + 0] = t,
                s[o + 1] = 1 & i ? 1 : 0,
                s[o + 2] = 2 & i ? 1 : 0,
                s[o + 3] = 4 & i ? 1 : 0,
                (a = this.dataTextures.group).needsUpdate = !0,
                (s = a.image.data)[o + 0] = 1 & i ? 1 : 0,
                s[o + 1] = 2 & i ? 1 : 0,
                s[o + 2] = 4 & i ? 1 : 0,
                s[o + 3] = 8 & i ? 1 : 0,
                (a = this.dataTextures.springs).needsUpdate = !0,
                s = a.image.data;
                for (var c = 0; c < 4; c++)
                    s[o + c] = -1;
                (a = this.dataTextures.springsDiagonal).needsUpdate = !0,
                s = a.image.data;
                for (c = 0; c < 4; c++)
                    s[o + c] = -1;
                return this.particleCount++
            }
            l("Too many particles: " + this.particleCount)
        },
        connectParticles(e, r, t) {
            if (e !== r) {
                var i = this;
                n(t ? this.dataTextures.springsDiagonal : this.dataTextures.springs)
            }
            function n(t) {
                for (var n, a, o = p(e, t.image.width, t.image.height), s = p(r, t.image.width, t.image.height), l = 0; l < 4; l++)
                    if (-1 === t.image.data[o + l]) {
                        n = l;
                        break
                    }
                for (l = 0; l < 4; l++)
                    if (-1 === t.image.data[s + l]) {
                        a = l;
                        break
                    }
                if (void 0 !== n && void 0 !== a) {
                    var c = i.dataTextures.particles;
                    p(e, c.image.width, c.image.height);
                    t.image.data[o + n] = r,
                    t.image.data[s + a] = e,
                    t.needsUpdate = !0
                }
            }
        },
        getParticleUV: function(r) {
            var t = this.particleTextureSize;
            return new e.Vector2(d(r, t) / t,u(r, 0, t) / t)
        },
        initTextures: function(r) {
            var t = /(iPad|iPhone|iPod)/g.test(navigator.userAgent) ? e.HalfFloatType : e.FloatType
              , i = function(e) {
                for (var r = 1; r * r < e; )
                    r *= 2;
                return r
            }(r);
            Object.assign(this.textures, {
                particleRead: x(i, i, t),
                particleWrite: x(i, i, t),
                springsRead: x(i, i, t),
                springsWrite: x(i, i, t),
                springsDiagonalRead: x(i, i, t),
                springsDiagonalWrite: x(i, i, t),
                grid: x(2 * this.broadphase.resolution.x, 2 * this.broadphase.resolution.y, t),
                explode: x(1, 1, t),
                exploded: x(1, 1, t),
                singleParticleData: x(1, 1, t),
                fourUnsignedBytes: x(4, 1, e.UnsignedByteType),
                tracked: x(this.maxTrackedParticles, 1, t),
                trackedUnsigned: x(4 * this.maxTrackedParticles, 1, e.UnsignedByteType)
            }),
            Object.assign(this.dataTextures, {
                particles: new e.DataTexture(new Float32Array(4 * i * i),i,i,e.RGBAFormat,t),
                mass: new e.DataTexture(new Float32Array(4 * i * i),i,i,e.RGBAFormat,t),
                springs: new e.DataTexture(new Float32Array(4 * i * i),i,i,e.RGBAFormat,t),
                springsDiagonal: new e.DataTexture(new Float32Array(4 * i * i),i,i,e.RGBAFormat,t),
                group: new e.DataTexture(new Float32Array(4 * i * i),i,i,e.RGBAFormat,t),
                singlePixel: new e.DataTexture(new Float32Array(4),1,1,e.RGBAFormat,t)
            })
        },
        reset: function() {
            for (var e in this.time = 0,
            this.particleCount = 0,
            this.dataTextures) {
                var r = this.dataTextures[e];
                r.needsUpdate = !0;
                for (var t = r.image.data, i = 0; i < t.length; i++)
                    t[i] = 0
            }
        },
        flushData: function() {
            this.time > 0 || (this.flushDataToRenderTarget(this.textures.particleWrite, this.dataTextures.particles),
            this.flushDataToRenderTarget(this.textures.particleRead, this.dataTextures.particles),
            this.flushDataToRenderTarget(this.textures.springsRead, this.dataTextures.springs),
            this.flushDataToRenderTarget(this.textures.springsDiagonalRead, this.dataTextures.springsDiagonal))
        },
        flushDataToRenderTarget: function(e, r) {
            var t = this.materials.textured;
            t.uniforms.texture.value = r,
            t.uniforms.res.value.set(e.width, e.height),
            this.fullscreenQuad.material = t,
            this.renderer.render(this.scenes.fullscreen, this.fullscreenCamera, e, !0),
            t.uniforms.texture.value = null,
            this.fullscreenQuad.material = null
        },
        setPositions: function(e, r) {
            this.setRenderTargetSubData(e, function(e, t) {
                var i = r[t];
                e.set(i.x, i.y, 0, 0)
            }, this.textures.particleRead, this.textures.particleWrite)
        },
        setRenderTargetSubData: function(r, t, i, n) {
            this.saveRendererState();
            if (!this.scenes.setParticleData) {
                this.materials.setParticleData = new e.ShaderMaterial({
                    uniforms: {},
                    vertexShader: a + "attribute float particleIndex;\r\nattribute vec4 data;\r\nvarying vec4 vData;\r\nvoid main() {\r\n\tvec2 uv = indexToUV(particleIndex, resolution);\r\n\tuv += 0.5 / resolution;\r\n\tgl_PointSize = 1.0;\r\n\tvData = data;\r\n\tgl_Position = vec4(2.0*uv-1.0, 0, 1);\r\n}",
                    fragmentShader: a + "varying vec4 vData;\r\nvoid main() {\r\n\tgl_FragColor = vData;\r\n}",
                    defines: this.getDefines()
                });
                var o = this.onePointPerParticleGeometry = new e.BufferGeometry
                  , s = new Float32Array(128)
                  , l = new Float32Array(512);
                o.addAttribute("position", new e.BufferAttribute(new Float32Array(384),3)).addAttribute("data", new e.BufferAttribute(l,4)).addAttribute("particleIndex", new e.BufferAttribute(s,1)),
                this.setParticleDataMesh = new e.Points(o,this.materials.setParticleData),
                this.scenes.setParticleData = new e.Scene,
                this.scenes.setParticleData.add(this.setParticleDataMesh)
            }
            for (var c = new e.Vector4, d = this.onePointPerParticleGeometry.attributes, u = 0; u < r.length; u += 128) {
                var p = Math.min(128, r.length - u);
                d.particleIndex.needsUpdate = !0,
                d.particleIndex.updateRange.count = p,
                d.data.needsUpdate = !0,
                d.data.updateRange.count = p;
                for (var m = 0; m < p; m++)
                    t(c, u + m),
                    d.particleIndex.array[m] = r[u + m],
                    d.data.array[4 * m + 0] = c.x,
                    d.data.array[4 * m + 1] = c.y,
                    d.data.array[4 * m + 2] = c.z,
                    d.data.array[4 * m + 3] = c.w;
                this.onePointPerParticleGeometry.setDrawRange(0, p),
                this.renderer.render(this.scenes.setParticleData, this.fullscreenCamera, i, !1),
                n && this.renderer.render(this.scenes.setParticleData, this.fullscreenCamera, n, !1)
            }
            this.restoreRendererState()
        },
        resetGridStencil: function() {
            if (void 0 === this.scenes.stencil2) {
                this.materials.stencil = new e.ShaderMaterial({
                    uniforms: {
                        res: {
                            value: new e.Vector2(this.textures.grid.width,this.textures.grid.height)
                        },
                        quadrant: {
                            value: 0
                        }
                    },
                    vertexShader: n,
                    fragmentShader: "uniform vec2 res;\r\nuniform float quadrant;\r\nvoid main() {\r\n\tvec2 coord = floor(gl_FragCoord.xy);\r\n\tif(mod(coord.x,2.0) + 2.0 * mod(coord.y,2.0) == quadrant){\r\n\t\tgl_FragColor = vec4(1,1,1,1);\r\n\t} else {\r\n\t\tdiscard;\r\n\t}\r\n}"
                }),
                this.scenes.stencil2 = new e.Scene;
                var r = new e.Mesh(new e.PlaneBufferGeometry(2,2),this.materials.stencil);
                this.scenes.stencil2.add(r)
            }
            var t = this.renderer;
            t.setClearColor(0, 1),
            t.clearTarget(this.textures.grid, !0, !0, !0);
            var i = t.state.buffers
              , a = t.context;
            i.depth.setTest(!1),
            i.depth.setMask(!1),
            i.depth.setLocked(!0),
            i.color.setMask(!1),
            i.color.setLocked(!0),
            i.stencil.setTest(!0),
            i.stencil.setOp(a.REPLACE, a.REPLACE, a.REPLACE),
            i.stencil.setClear(0),
            i.stencil.setFunc(a.ALWAYS, 1, 4294967295);
            for (var o = 0; o < 2; o++)
                for (var s = 0; s < 2; s++) {
                    var l = o + 2 * s;
                    0 !== l && (this.materials.stencil.uniforms.quadrant.value = l,
                    i.stencil.setFunc(a.ALWAYS, l, 4294967295),
                    t.render(this.scenes.stencil2, this.fullscreenCamera, this.textures.grid, !1))
                }
            i.depth.setLocked(!1),
            i.depth.setMask(!0),
            i.depth.setTest(!0),
            i.color.setLocked(!1),
            i.color.setMask(!0)
        },
        updateGrid: function() {
            this.resetGridStencil();
            var r = this.renderer
              , t = r.state.buffers
              , i = r.context
              , n = this.materials.mapParticle;
            if (!n) {
                n = this.materials.mapParticle = new e.ShaderMaterial({
                    uniforms: {
                        posTex: {
                            value: null
                        },
                        posTex2: {
                            value: null
                        },
                        cellSize: {
                            value: this.cellSize
                        },
                        gridPos: {
                            value: this.broadphase.position
                        },
                        params2: {
                            value: this.params2
                        }
                    },
                    vertexShader: a + "uniform sampler2D posTex;\r\nuniform sampler2D posTex2;\r\nuniform vec2 cellSize;\r\nuniform vec2 gridPos;\r\nuniform vec4 params2;\r\n#define centerParticleIndex params2.w\r\n\r\nattribute float particleIndex;\r\n\r\nvarying float vParticleIndex;\r\nvarying vec3 vGroup;\r\n\r\nvoid main() {\r\n\r\n    vParticleIndex = particleIndex;\r\n    vec2 particleUV = indexToUV(particleIndex, resolution);\r\n    vec2 particlePos = texture2D( posTex, particleUV ).xy;\r\n\r\n    vec4 massGroupMask = texture2D( posTex2, particleUV );\r\n    vGroup = massGroupMask.yzw;\r\n\r\n    vec2 playerParticleUV = indexToUV(centerParticleIndex,resolution).xy;\r\n    vec4 playerParticlePosAndVel = texture2D(posTex,playerParticleUV);\r\n    vec2 gridPosition = playerParticlePosAndVel.xy - 0.5 * gridResolution * cellSize;\r\n\r\n    // Get particle cell position\r\n    vec2 cellPos = worldPosToGridPos(particlePos, gridPosition, cellSize);\r\n    vec2 gridUV = gridPosToGridUV(cellPos, 0, gridResolution, gridTextureResolution);\r\n    gridUV += vec2(1) / gridTextureResolution;// center to cell\r\n    gl_PointSize = 2.0; // Cover 4 pixels in the grid texture\r\n    gl_Position = vec4(2.0*(gridUV-0.5), 0, 1);\r\n}",
                    fragmentShader: a + "varying float vParticleIndex;\r\nvarying vec3 vGroup;\r\n\r\nvoid main() {\r\n    gl_FragColor = vec4( vParticleIndex+1.0, vGroup ); // indices are stored incremented by 1\r\n}",
                    defines: this.getDefines()
                }),
                this.scenes.mapParticlesToGrid = new e.Scene;
                for (var o = new e.BufferGeometry, s = this.textures.particleRead.width, l = new Float32Array(3 * s * s), c = new Float32Array(s * s), d = 0; d < s * s; d++)
                    c[d] = d;
                o.addAttribute("position", new e.BufferAttribute(l,3)).addAttribute("particleIndex", new e.BufferAttribute(c,1)),
                this.mapParticleToCellMesh = new e.Points(o,this.materials.mapParticle),
                this.scenes.mapParticlesToGrid.add(this.mapParticleToCellMesh)
            }
            t.stencil.setFunc(i.EQUAL, 3, 4294967295),
            t.stencil.setOp(i.INCR, i.INCR, i.INCR),
            this.mapParticleToCellMesh.material = n,
            n.uniforms.posTex.value = this.textures.particleRead.texture,
            n.uniforms.posTex2.value = this.dataTextures.mass.texture,
            r.render(this.scenes.mapParticlesToGrid, this.fullscreenCamera, this.textures.grid, !1),
            n.uniforms.posTex.value = null,
            n.uniforms.posTex2.value = null,
            this.mapParticleToCellMesh.material = null,
            t.stencil.setTest(!1)
        },
        updateParticles: function() {
            var r = this.renderer
              , t = r.state.buffers
              , i = (r.context,
            this.materials.updateParticles);
            i || (i = this.materials.updateParticles = new e.ShaderMaterial({
                uniforms: {
                    cellSize: {
                        value: this.cellSize
                    },
                    gridPos: {
                        value: this.broadphase.position
                    },
                    posTex: {
                        value: null
                    },
                    particleTex2: {
                        value: null
                    },
                    groupTex: {
                        value: null
                    },
                    particleSprings: {
                        value: null
                    },
                    particleSpringsDiagonal: {
                        value: null
                    },
                    gridTex: {
                        value: this.textures.grid.texture
                    },
                    explodeTex: {
                        value: null
                    },
                    params1: {
                        value: this.params1
                    },
                    params2: {
                        value: this.params2
                    },
                    params3: {
                        value: this.params3
                    },
                    params4: {
                        value: this.params4
                    },
                    gravity: {
                        value: this.gravity
                    },
                    applyForceMask: {
                        value: this.applyForceMask
                    },
                    applyForce: {
                        value: this.applyForce
                    },
                    applyForceMask2: {
                        value: this.applyForceMask2
                    },
                    applyForce2: {
                        value: this.applyForce2
                    },
                    applyGravityMask: {
                        value: this.applyGravityMask
                    },
                    applyTorqueMaskAndCenterParticleId: {
                        value: this.applyTorqueMaskAndCenterParticleId
                    },
                    BOX_MIN: {
                        value: this.boxMin
                    },
                    BOX_MAX: {
                        value: this.boxMax
                    },
                    tearRadius: {
                        value: 50 * this.radius
                    },
                    fixedTime: {
                        value: .01
                    }
                },
                vertexShader: n,
                fragmentShader: a + "uniform vec4 params1;\r\n#define stiffness params1.x\r\n#define damping params1.y\r\n#define radius params1.z\r\n#define maxVelocity params1.w\r\n\r\nuniform vec4 params2;\r\n#define friction params2.y\r\n#define drag params2.z\r\n#define centerParticleIndex params2.w\r\n\r\nuniform vec4 params3;\r\n#define interactionSpherePos params3.xyz\r\n#define interactionSphereRadius params3.w\r\n#define deltaTime params2.x\r\n\r\nuniform vec4 params4;\r\n#define applyTorque params4.x\r\n#define applyStretch params4.y\r\n#define applyStretchId1 params4.z\r\n#define applyStretchId2 params4.w\r\n\r\nuniform vec2 cellSize;\r\nuniform vec2 gridPos;\r\nuniform vec2 gravity;\r\n\r\nuniform vec2 BOX_MIN;\r\nuniform vec2 BOX_MAX;\r\n\r\nuniform vec4 applyForceMask;\r\nuniform vec2 applyForce;\r\nuniform vec4 applyForceMask2;\r\nuniform vec2 applyForce2;\r\nuniform vec4 applyGravityMask;\r\nuniform float tearRadius;\r\nuniform float fixedTime;\r\n\r\nuniform vec4 applyTorqueMaskAndCenterParticleId;\r\n\r\nuniform sampler2D posTex;\r\nuniform sampler2D gridTex;\r\nuniform sampler2D particleTex2;\r\nuniform sampler2D groupTex;\r\nuniform sampler2D particleSprings;\r\nuniform sampler2D particleSpringsDiagonal;\r\nuniform sampler2D explodeTex;\r\n\r\nvec2 particleForce(float STIFFNESS, float DAMPING, float DAMPING_T, float distance, float minDistance, vec2 xi, vec2 xj, vec2 vi, vec2 vj){\r\n    vec2 rij = xj - xi;\r\n    vec2 rij_unit = normalize(rij);\r\n    vec2 vij = vj - vi;\r\n    vec2 vij_t = vij - dot(vij, rij_unit) * rij_unit;\r\n    vec2 springForce = - STIFFNESS * (distance - max(length(rij), minDistance)) * rij_unit;\r\n    vec2 dampingForce = DAMPING * dot(vij,rij_unit) * rij_unit;\r\n    vec2 tangentForce = DAMPING_T * vij_t;\r\n    return springForce + dampingForce + tangentForce;\r\n}\r\n\r\nvec2 neighborSpringForce(float neighborIndex, vec2 position, vec2 velocity, float d){\r\n    vec2 neighborUV = indexToUV(neighborIndex, resolution);\r\n    vec4 neighborPositionAndVelocity = texture2D(posTex, neighborUV);\r\n    vec2 neighborPosition = neighborPositionAndVelocity.xy;\r\n    vec2 neighborVelocity = neighborPositionAndVelocity.zw;\r\n\r\n    vec2 r = position - neighborPosition;\r\n    vec2 springForce = - stiffness * (length(r) - d) * normalize(r);\r\n\r\n    //springForce *= step(-10.0 * radius, -length(r));\r\n\r\n    springForce *= step(-0.5, neighborIndex);\r\n\r\n    return springForce;\r\n}\r\n\r\nvoid main() {\r\n    vec2 uv = gl_FragCoord.xy / resolution;\r\n    int particleIndex = uvToIndex(uv, resolution);\r\n\r\n    // Get velocity and position of current particle\r\n    vec4 positionAndVelocity = texture2D(posTex, uv);\r\n    vec2 position = positionAndVelocity.xy;\r\n    vec2 velocity = positionAndVelocity.zw;\r\n\r\n    if(velocity.x > 500.0){\r\n        velocity = vec2(0.0); // reset velocity after explosion\r\n    }\r\n\r\n    vec4 massGroupMask = texture2D(particleTex2, uv);\r\n    vec4 vectorGroup2 = texture2D(groupTex, uv);\r\n\r\n    // Center particle\r\n    vec2 playerParticleUV = indexToUV(centerParticleIndex,resolution).xy;\r\n    vec4 playerParticlePosAndVel = texture2D(posTex,playerParticleUV);\r\n    vec2 gridPosition = playerParticlePosAndVel.xy - 0.5 * gridResolution * cellSize;\r\n\r\n    vec2 particleGridPos = worldPosToGridPos(position, gridPosition, cellSize);\r\n    ivec2 iGridRes = ivec2(floor(gridResolution));\r\n    ivec2 iParticleGridPos = ivec2(floor(particleGridPos));\r\n\r\n    if(iParticleGridPos.x > iGridRes.x || iParticleGridPos.y > iGridRes.y || iParticleGridPos.x < 0 || iParticleGridPos.y < 0){\r\n        discard;\r\n    }\r\n\r\n    const vec2 centerToCell = vec2(0.5) / (2.0 * gridTextureResolution);\r\n\r\n    vec2 force = vec2(0);\r\n\r\n    // Apply gravity\r\n    force += step(0.5, dot(applyGravityMask, vectorGroup2)) * gravity;\r\n\r\n    // Enemies: add movement to left\r\n    force += step(0.5, dot(applyForceMask2, vectorGroup2)) * applyForce2;\r\n\r\n    // Apply force\r\n    force += step(0.5, dot(applyForceMask, vectorGroup2)) * applyForce;\r\n\r\n    // Apply torque\r\n    vec4 applyTorqueMask = vec4(applyTorqueMaskAndCenterParticleId.xyz, 0);\r\n    vec2 applyTorqueUV = indexToUV(applyTorqueMaskAndCenterParticleId.w,resolution).xy;\r\n    vec2 applyTorquePos = texture2D(posTex,applyTorqueUV).xy;\r\n    float torqueMultiplier = step(0.5, dot(applyTorqueMask, vectorGroup2));\r\n    force += torqueMultiplier * applyTorque * (cross(vec3(position - applyTorquePos,0.0), vec3(0,0,-1))).xy;\r\n\r\n    // Apply stretch, reuse applyTorqueMask\r\n    {\r\n        vec2 applyStretchPos1 = texture2D(posTex, indexToUV(applyStretchId1,resolution)).xy;\r\n        vec2 applyStretchPos2 = texture2D(posTex, indexToUV(applyStretchId2,resolution)).xy;\r\n        float len = length(applyStretchPos2 - applyStretchPos1);\r\n        if( len > 0.0 ){\r\n            force += torqueMultiplier * applyStretch * (applyStretchPos2 - applyStretchPos1) / len;\r\n            force += torqueMultiplier * applyStretch * (position - applyStretchPos1) / len;\r\n        }\r\n    }\r\n\r\n    // Apply explode force\r\n\r\n\r\n    bool shouldExplode = false;\r\n\r\n    // Neighbor collisions\r\n    for(int i=0; i<=2; i++){\r\n        for(int j=0; j<=2; j++){\r\n            ivec2 iNeighborCellGridPos = iParticleGridPos + ivec2(i-1,j-1);\r\n            vec2 neighborCellGridPos = vec2(iNeighborCellGridPos);\r\n            for(int l=1; l<4; l++){\r\n                vec2 neighborCellTexUV = gridPosToGridUV(neighborCellGridPos.xy, l, gridResolution, gridTextureResolution);\r\n                neighborCellTexUV += centerToCell; // center to cell pixel\r\n\r\n                vec4 gridData = texture2D(gridTex, neighborCellTexUV);\r\n                float fNeighborIndex = floor(gridData.x - 1.0 + 0.5); // indices are stored incremented by 1\r\n\r\n                int neighborIndex = int(floor(fNeighborIndex));\r\n                vec2 neighborUV = indexToUV(fNeighborIndex, resolution);\r\n                vec4 neighborPositionAndVelocity = texture2D(posTex, neighborUV);\r\n                vec2 neighborPosition = neighborPositionAndVelocity.xy;\r\n                vec2 neighborVelocity = neighborPositionAndVelocity.zw;\r\n                if(neighborVelocity.x > 500.0){\r\n                    neighborVelocity = vec2(0.0);\r\n                }\r\n\r\n                //vec4 neighborMassGroupMask = texture2D(particleTex2, neighborUV);\r\n                //float neighborGroup = gridData.y; // Why does this not work?\r\n                //float neighborMask = gridData.z;\r\n                //float neighborGroup = neighborMassGroupMask.y;\r\n                //float neighborMask = neighborMassGroupMask.z;\r\n\r\n                //vec4 neighborVectorGroup = floatToRGBA(neighborGroup) * 2.0;\r\n                //vec4 neighborVectorMask = floatToRGBA(neighborMask) * 2.0;\r\n\r\n                //vec3 neighborVectorGroup2 = neighborMassGroupMask.yzw;\r\n                vec4 neighborVectorGroup2 = texture2D(groupTex, neighborUV);\r\n\r\n                float forceMultiplier =\r\n                    step(0.5, dot(vectorGroup2, neighborVectorGroup2)) * // group & group\r\n                    //step(0.5, dot(vectorGroup, neighborVectorMask)) * // group & mask\r\n                    //step(0.5, dot(vectorMask, neighborVectorGroup)) * // mask & group\r\n                    step(-0.5, fNeighborIndex) *\r\n                    step(0.0, neighborCellGridPos.x) *\r\n                    step(0.0, neighborCellGridPos.y)\r\n                    ;\r\n\r\n                if(\r\n                    //neighborIndex >=0 &&\r\n                    neighborIndex != particleIndex && // Not self!\r\n                    //iNeighborCellGridPos.x>=0 &&\r\n                    //iNeighborCellGridPos.y>=0 &&\r\n                    iNeighborCellGridPos.x<iGridRes.x &&\r\n                    iNeighborCellGridPos.y<iGridRes.y\r\n\r\n                ){\r\n                    // Apply contact force from neighbor\r\n                    vec2 r = position - neighborPosition;\r\n                    float len = length(r);\r\n                    forceMultiplier *= step(len, radius * 2.0); // len < 2 * radius\r\n                    if( len > 0.0 ){\r\n                        // Explode if player is touching enemy\r\n                        bool isPlayer = dot(vec4(0,0,1,0), vectorGroup2) > 0.5;\r\n                        bool neighborIsEnemy = dot(vec4(0,0,0,1), neighborVectorGroup2) > 0.5;\r\n                        vec4 neighborSpringConnections = texture2D(particleSprings, neighborUV);\r\n                        bool neighborIsChunk = dot(neighborSpringConnections, vec4(1.0)) > -4.0;\r\n                        if(isPlayer && neighborIsEnemy && neighborIsChunk){\r\n                            shouldExplode = true;\r\n                        }\r\n\r\n                        force += forceMultiplier * particleForce(stiffness, damping, friction, 2.0 * radius, radius, position, neighborPosition, velocity, neighborVelocity);\r\n                    }\r\n                }\r\n            }\r\n        }\r\n    }\r\n\r\n    // Spring forces\r\n    vec4 neighborIndices = texture2D(particleSprings, uv);\r\n    force += neighborSpringForce(neighborIndices.x, position, velocity, radius * 2.0);\r\n    force += neighborSpringForce(neighborIndices.y, position, velocity, radius * 2.0);\r\n    force += neighborSpringForce(neighborIndices.z, position, velocity, radius * 2.0);\r\n    force += neighborSpringForce(neighborIndices.w, position, velocity, radius * 2.0);\r\n\r\n    // Diagonal spring forces\r\n    vec4 neighborIndices2 = texture2D(particleSpringsDiagonal, uv);\r\n    float diagonalDistance = radius * 2.0 * 1.41;\r\n    force += neighborSpringForce(neighborIndices2.x, position, velocity, diagonalDistance);\r\n    force += neighborSpringForce(neighborIndices2.y, position, velocity, diagonalDistance);\r\n    force += neighborSpringForce(neighborIndices2.z, position, velocity, diagonalDistance);\r\n    force += neighborSpringForce(neighborIndices2.w, position, velocity, diagonalDistance);\r\n\r\n    // Apply force from ground / bounds\r\n    vec2 boxMin = BOX_MIN;\r\n    vec2 boxMax = BOX_MAX;\r\n    vec2 dirs[2];\r\n    dirs[0] = vec2(1,0);\r\n    dirs[1] = vec2(0,1);\r\n    for(int i=0; i<2; i++){\r\n        vec2 dir = dirs[i];\r\n        vec2 v = velocity;\r\n        vec2 tangentVel = v - dot(v,dir) * dir;\r\n        float x = dot(dir,position) - radius;\r\n        if(x < dot(boxMin, dir)){\r\n            force += -( stiffness * (x - dot(boxMin, dir)) * dir + damping * dot(v,dir) * dir);\r\n            force -= friction * tangentVel;\r\n        }\r\n        x = dot(dir,position) + radius;\r\n        if(x > dot(boxMax, dir)){\r\n            dir = -dir;\r\n            force -= -( stiffness * (x + dot(boxMax, dir)) * dir - damping * dot(v,dir) * dir);\r\n            force -= friction * tangentVel;\r\n        }\r\n    }\r\n    \r\n    // Integrate particle\r\n    vec2 isInside = isInsideGrid3( position, gridPosition, gridResolution, cellSize, vec2(0.02) );\r\n    //isInside.y = 1.0;\r\n    float timeScale = isInside.x * isInside.y;\r\n    float invMass = massGroupMask.x;\r\n    vec2 newVelocity = velocity + force * deltaTime * timeScale * invMass;\r\n    newVelocity *= timeScale; // TODO: Correct?\r\n    newVelocity = clamp(newVelocity, -maxVelocity, maxVelocity);\r\n    newVelocity *= pow(1.0 - drag, deltaTime);\r\n    vec2 newPosition = position + newVelocity * deltaTime * timeScale;\r\n    \r\n    // Don't want an explosion unless we have a chunk of player touching a chunk of enemy\r\n    //bool isConnected = (dot(neighborIndices, vec4(1.0)) > -4.0) && (dot(neighborIndices2, vec4(1.0)) > -4.0);\r\n    if(dot(neighborIndices, vec4(1.0)) > -4.0){\r\n        if(dot(neighborIndices2, vec4(1.0)) > -4.0){\r\n            if(shouldExplode){\r\n                newVelocity.x = 1000.0;\r\n            }\r\n        }\r\n    }\r\n    \r\n    gl_FragColor = vec4(newPosition, newVelocity);\r\n}",
                defines: this.getDefines()
            })),
            t.depth.setTest(!1),
            t.stencil.setTest(!1),
            this.fullscreenQuad.material = this.materials.updateParticles,
            i.uniforms.fixedTime.value = this.fixedTime,
            i.uniforms.posTex.value = this.textures.particleRead.texture,
            i.uniforms.particleTex2.value = this.dataTextures.mass,
            i.uniforms.groupTex.value = this.dataTextures.group,
            i.uniforms.particleSprings.value = this.textures.springsRead.texture,
            i.uniforms.particleSpringsDiagonal.value = this.textures.springsDiagonalRead.texture,
            i.uniforms.explodeTex.value = this.textures.explode.texture,
            r.render(this.scenes.fullscreen, this.fullscreenCamera, this.textures.particleWrite, !1),
            i.uniforms.explodeTex.value = null,
            i.uniforms.particleSpringsDiagonal.value = null,
            i.uniforms.particleSprings.value = null,
            i.uniforms.particleTex2.value = null,
            i.uniforms.groupTex.value = null,
            i.uniforms.posTex.value = null,
            this.fullscreenQuad.material = null,
            this.swapTextures("particleRead", "particleWrite")
        },
        explodeParticle: function(e) {
            var r = this.materials.mapParticleToExplode;
            r && (r.uniforms.overrideExplodeParticleIndex.value = e)
        },
        updateExplodeParticle: function() {
            var r = this.renderer
              , t = this.materials.mapParticleToExplode;
            if (!t) {
                t = this.materials.mapParticleToExplode = new e.ShaderMaterial({
                    uniforms: {
                        posTex: {
                            value: null
                        },
                        params2: {
                            value: this.params2
                        },
                        overrideExplodeParticleIndex: {
                            value: -10
                        }
                    },
                    vertexShader: a + "uniform sampler2D posTex;\r\nuniform vec4 params2;\r\nuniform float overrideExplodeParticleIndex;\r\n\r\nattribute float particleIndex;\r\n\r\nvarying float vParticleIndex;\r\n\r\nvoid main() {\r\n\r\n    vParticleIndex = particleIndex;\r\n    vec2 particleUV = indexToUV(particleIndex, resolution);\r\n    vec4 particlePosVel = texture2D(posTex, particleUV);\r\n    vec2 position = particlePosVel.xy;\r\n    vec2 velocity = particlePosVel.zw;\r\n\r\n    gl_PointSize = 2.0; // Cover 1 pixel\r\n\r\n    if(length(velocity) > 500.0 || abs(particleIndex - overrideExplodeParticleIndex) < 0.5){\r\n        gl_Position = vec4(0, 0, 0, 1); // center\r\n    } else {\r\n        gl_Position = vec4(-100, -100, 0, 1); // off screen\r\n    }\r\n}",
                    fragmentShader: a + "varying float vParticleIndex;\r\n\r\nvoid main() {\r\n    gl_FragColor = vec4( vParticleIndex+1.0, 0,0,1 ); // indices are stored incremented by 1\r\n}\r\n",
                    defines: this.getDefines()
                }),
                this.scenes.mapParticlesToExplode = new e.Scene;
                for (var i = new e.BufferGeometry, n = this.textures.particleRead.width, o = new Float32Array(3 * n * n), s = new Float32Array(n * n), l = 0; l < n * n; l++)
                    s[l] = l;
                i.addAttribute("position", new e.BufferAttribute(o,3)).addAttribute("particleIndex", new e.BufferAttribute(s,1)),
                this.mapParticleToExplodeMesh = new e.Points(i,t),
                this.scenes.mapParticlesToExplode.add(this.mapParticleToExplodeMesh)
            }
            this.mapParticleToExplodeMesh.geometry.setDrawRange(0, this.particleCount),
            this.mapParticleToExplodeMesh.material = t,
            t.uniforms.posTex.value = this.textures.particleRead.texture,
            r.render(this.scenes.mapParticlesToExplode, this.fullscreenCamera, this.textures.explode, !0),
            t.uniforms.posTex.value = null,
            t.uniforms.overrideExplodeParticleIndex.value = -10,
            this.mapParticleToExplodeMesh.material = null
        },
        updateExplodedParticle: function() {
            var r = this.renderer
              , t = this.materials.captureExploded;
            t || (t = this.materials.captureExploded = new e.ShaderMaterial({
                uniforms: {
                    explodeTex: {
                        value: null
                    },
                    params2: {
                        value: this.params2
                    }
                },
                blending: e.AdditiveBlending,
                depthTest: !1,
                transparent: !0,
                vertexShader: a + n,
                fragmentShader: a + "uniform sampler2D explodeTex;\r\n\r\nvoid main() {\r\n    float explodeId = texture2D(explodeTex, vec2(0.5)).x;\r\n    if(explodeId > 0.0)\r\n        gl_FragColor = vec4(1,1,1,1);\r\n    else\r\n        gl_FragColor = vec4(0,0,0,0);\r\n}",
                defines: this.getDefines()
            })),
            t.uniforms.explodeTex.value = this.textures.explode.texture,
            this.fullscreenQuad.material = t,
            r.render(this.scenes.fullscreen, this.fullscreenCamera, this.textures.exploded, !1),
            this.fullscreenQuad.material = null,
            t.uniforms.explodeTex.value = null
        },
        clearExploded: function() {
            this.flushDataToRenderTarget(this.textures.exploded, this.dataTextures.singlePixel)
        },
        hasExploded: function() {
            var e = new Float32Array(4);
            return this.readByteData(e, this.textures.exploded.texture, this.textures.fourUnsignedBytes),
            e[0] > 0
        },
        updateTrackedParticleData: function() {
            var r = this.renderer
              , t = this.materials.mapParticleToTracked;
            if (!t) {
                t = this.materials.mapParticleToTracked = new e.ShaderMaterial({
                    uniforms: {
                        posTex: {
                            value: null
                        },
                        params2: {
                            value: this.params2
                        }
                    },
                    vertexShader: a + "uniform sampler2D posTex;\r\nuniform vec4 params2;\r\n\r\nattribute float vertexIndex;\r\nattribute float particleTrackedIndex;\r\n\r\nvarying vec4 vParticleData;\r\nvarying float vVertexIndex;\r\n\r\nvoid main() {\r\n    vec2 particleUV = indexToUV(particleTrackedIndex, resolution);\r\n    vParticleData = texture2D(posTex, particleUV);\r\n    vVertexIndex = vertexIndex;\r\n    gl_PointSize = 1.0;\r\n    gl_Position = vec4(vertexIndex / MAX_TRACKED_PARTICLES * 2.0 - 1.0, 0, 0, 1);\r\n}",
                    fragmentShader: a + "varying vec4 vParticleData;\r\n//varying float vVertexIndex;\r\n\r\nvoid main() {\r\n    gl_FragColor = vParticleData;\r\n    //gl_FragColor = vec4(vVertexIndex);\r\n}\r\n",
                    defines: this.getDefines()
                }),
                this.scenes.mapParticlesToTracked = new e.Scene;
                for (var i = new e.BufferGeometry, n = new Float32Array(3 * this.maxTrackedParticles), o = new Float32Array(this.maxTrackedParticles), s = 0; s < this.maxTrackedParticles; s++)
                    o[s] = s;
                i.addAttribute("position", new e.BufferAttribute(n,3)).addAttribute("particleTrackedIndex", new e.BufferAttribute(this.particleTrackedIndices,1)).addAttribute("vertexIndex", new e.BufferAttribute(o,1)),
                this.mapParticleToTrackedMesh = new e.Points(i,t),
                this.scenes.mapParticlesToTracked.add(this.mapParticleToTrackedMesh)
            }
            this.mapParticleToTrackedMesh.geometry.attributes.particleTrackedIndex.needsUpdate = !0,
            this.mapParticleToTrackedMesh.geometry.setDrawRange(0, this.maxTrackedParticles),
            this.mapParticleToTrackedMesh.material = t,
            t.uniforms.posTex.value = this.textures.particleRead.texture,
            r.render(this.scenes.mapParticlesToTracked, this.fullscreenCamera, this.textures.tracked, !0),
            t.uniforms.posTex.value = null,
            this.mapParticleToTrackedMesh.material = null,
            this.readByteData(this.trackedParticleData, this.textures.tracked.texture, this.textures.trackedUnsigned)
        },
        readParticleData: function(r, t) {
            var i = this.renderer
              , o = this.materials.renderSingleParticleDataToFullscreen = this.materials.renderSingleParticleDataToFullscreen || new e.ShaderMaterial({
                uniforms: {
                    particleId: {
                        value: 0
                    },
                    particleTex: {
                        value: null
                    }
                },
                vertexShader: a + n,
                fragmentShader: a + "uniform sampler2D particleTex;\r\nuniform float particleId;\r\n\r\nvoid main() {\r\n    vec2 uv = indexToUV(particleId, resolution);\r\n    vec4 positionAndVelocity = texture2D(particleTex, uv);\r\n    gl_FragColor = positionAndVelocity;\r\n}",
                defines: this.getDefines()
            });
            this.fullscreenQuad.material = o,
            o.uniforms.particleTex.value = this.textures.particleRead.texture,
            o.uniforms.particleId.value = r,
            i.render(this.scenes.fullscreen, this.fullscreenCamera, this.textures.singleParticleData, !0),
            o.uniforms.particleTex.value = null,
            this.fullscreenQuad.material = null,
            this.readByteData(t, this.textures.singleParticleData.texture, this.textures.fourUnsignedBytes)
        },
        readByteData: function(r, t, i) {
            var a = this.materials.renderToReadableTexture = this.materials.renderToReadableTexture || new e.ShaderMaterial({
                uniforms: {
                    resolution: {
                        value: new e.Vector2(1,1)
                    },
                    texture: {
                        value: null
                    }
                },
                vertexShader: n,
                fragmentShader: "uniform sampler2D texture;\r\nuniform vec2 resolution;\r\n\r\n// http://concord-consortium.github.io/lab/experiments/webgl-gpgpu/webgl.html\r\nfloat shift_right(float v, float amt) {\r\n\tv = floor(v) + 0.5;\r\n\treturn floor(v / exp2(amt));\r\n}\r\nfloat shift_left(float v, float amt) {\r\n\treturn floor(v * exp2(amt) + 0.5);\r\n}\r\nfloat mask_last(float v, float bits) {\r\n\treturn mod(v, shift_left(1.0, bits));\r\n}\r\nfloat extract_bits(float num, float from, float to) {\r\n\tfrom = floor(from + 0.5);\r\n\tto = floor(to + 0.5);\r\n\treturn mask_last(shift_right(num, from), to - from);\r\n}\r\nvec4 encode_float(float val) {\r\n\tif (val == 0.0)\r\n\t\treturn vec4(0, 0, 0, 0);\r\n\tfloat sign = val > 0.0 ? 0.0 : 1.0;\r\n\tval = abs(val);\r\n\tfloat exponent = floor(log2(val));\r\n\tfloat biased_exponent = exponent + 127.0;\r\n\tfloat fraction = ((val / exp2(exponent)) - 1.0) * 8388608.0;\r\n\r\n\tfloat t = biased_exponent / 2.0;\r\n\tfloat last_bit_of_biased_exponent = fract(t) * 2.0;\r\n\tfloat remaining_bits_of_biased_exponent = floor(t);\r\n\r\n\tfloat byte4 = extract_bits(fraction, 0.0, 8.0) / 255.0;\r\n\tfloat byte3 = extract_bits(fraction, 8.0, 16.0) / 255.0;\r\n\tfloat byte2 = (last_bit_of_biased_exponent * 128.0 + extract_bits(fraction, 16.0, 23.0)) / 255.0;\r\n\tfloat byte1 = (sign * 128.0 + remaining_bits_of_biased_exponent) / 255.0;\r\n\treturn vec4(byte4, byte3, byte2, byte1);\r\n}\r\n\r\nvoid main() {\r\n\tvec2 uv = gl_FragCoord.xy / resolution;\r\n\tvec4 data = texture2D(texture, uv);\r\n\tint component = int(floor(mod(gl_FragCoord.x, 4.0)));\r\n\tfloat theFloat = 0.0;\r\n\tif(component == 0) theFloat = data.x;\r\n\tif(component == 1) theFloat = data.y;\r\n\tif(component == 2) theFloat = data.z;\r\n\tif(component == 3) theFloat = data.w;\r\n\tgl_FragColor = encode_float(theFloat);\r\n}"
            });
            this.fullscreenQuad.material = a,
            a.uniforms.texture.value = t,
            a.uniforms.resolution.value.set(i.width, i.height),
            this.renderer.render(this.scenes.fullscreen, this.fullscreenCamera, i, !0),
            a.uniforms.texture.value = null,
            this.fullscreenQuad.material = null;
            var o = new Uint8Array(r.buffer);
            this.renderer.readRenderTargetPixels(i, 0, 0, i.width, i.height, o)
        },
        tearSprings: function() {
            var r = this.renderer
              , t = this.materials.tearSprings;
            t || (t = this.materials.tearSprings = new e.ShaderMaterial({
                uniforms: {
                    explodeTex: {
                        value: null
                    },
                    particleTex: {
                        value: null
                    },
                    springsTex: {
                        value: null
                    },
                    tearRadius: {
                        value: 50 * this.radius
                    }
                },
                vertexShader: n,
                fragmentShader: a + "uniform sampler2D explodeTex;\r\nuniform sampler2D particleTex;\r\nuniform sampler2D springsTex;\r\nuniform float tearRadius;\r\n\r\nvoid main() {\r\n    vec2 uv = gl_FragCoord.xy / resolution;\r\n    int particleIndex = uvToIndex(uv, resolution);\r\n\r\n    vec4 springIds = texture2D(springsTex, uv);\r\n\r\n\tvec4 particlePositionAndVelocity = texture2D(particleTex, uv);\r\n\tvec2 position = particlePositionAndVelocity.xy;\r\n\r\n\tfloat explodeIndex = texture2D(explodeTex, vec2(0.5,0.5)).x - 1.0;\r\n\tvec2 explodeUV = indexToUV(explodeIndex, resolution);\r\n\tvec2 explodePosition = texture2D(particleTex, explodeUV).xy;\r\n\tif(explodeIndex > 0.0){\r\n\r\n\t\t// If the current particle is within the radius, disconnect everything\r\n\t\tif(length(position - explodePosition) < tearRadius){\r\n\t\t\tspringIds = vec4(-1);\r\n\t\t}\r\n\r\n\t\tfor(int i=0; i<4; i++){\r\n\r\n\t\t\t// If the other particle is within the radius, it should be disconnected too.\r\n\t\t\tvec2 particleUV2 = indexToUV(springIds[i],resolution).xy;\r\n\t\t\tvec4 particlePositionAndVelocity2 = texture2D(particleTex, particleUV2);\r\n\t\t\tvec2 position2 = particlePositionAndVelocity2.xy;\r\n\t\t\tif(length(explodePosition - position2) < tearRadius){\r\n\t\t\t\tspringIds[i] = -1.0;\r\n\t\t\t}\r\n\t\t}\r\n\t}\r\n\r\n    gl_FragColor = springIds;\r\n}",
                defines: this.getDefines()
            }));
            var i = this;
            function o(e) {
                i.fullscreenQuad.material = i.materials.tearSprings,
                t.uniforms.explodeTex.value = i.textures.explode.texture,
                t.uniforms.particleTex.value = i.textures.particleRead.texture,
                t.uniforms.springsTex.value = i.textures[e + "Read"].texture,
                r.render(i.scenes.fullscreen, i.fullscreenCamera, i.textures[e + "Write"], !1),
                t.uniforms.springsTex.value = null,
                t.uniforms.particleTex.value = null,
                t.uniforms.explodeTex.value = null,
                i.fullscreenQuad.material = null,
                i.swapTextures(e + "Read", e + "Write")
            }
            o("springs"),
            o("springsDiagonal")
        },
        addExplodeForce: function() {
            var r = this.renderer
              , t = this.materials.addExplodeForce;
            t || (t = this.materials.addExplodeForce = new e.ShaderMaterial({
                uniforms: {
                    explodeTex: {
                        value: null
                    },
                    particleTex: {
                        value: null
                    },
                    tearRadius: {
                        value: 50 * this.radius
                    }
                },
                vertexShader: n,
                fragmentShader: a + "uniform sampler2D explodeTex;\r\nuniform sampler2D particleTex;\r\nuniform float tearRadius;\r\n\r\nvoid main() {\r\n    vec2 uv = gl_FragCoord.xy / resolution;\r\n    int particleIndex = uvToIndex(uv, resolution);\r\n\r\n\tvec4 particlePositionAndVelocity = texture2D(particleTex, uv);\r\n\tvec2 position = particlePositionAndVelocity.xy;\r\n\r\n\tfloat explodeIndex = texture2D(explodeTex, vec2(0.5,0.5)).x - 1.0;\r\n\tvec2 explodeUV = indexToUV(explodeIndex, resolution);\r\n\tvec2 explodePosition = texture2D(particleTex, explodeUV).xy;\r\n\tif(explodeIndex > 0.0){\r\n        float len = length(position - explodePosition);\r\n\t\tif(len < tearRadius && len > 0.0){\r\n            vec2 explodeForceDirection = normalize(position - explodePosition);\r\n            vec2 force = explodeForceDirection * 50.0 / 120.0;\r\n\t\t\tparticlePositionAndVelocity.zw += force;\r\n\t\t}\r\n\t}\r\n\r\n    gl_FragColor = particlePositionAndVelocity;\r\n}",
                defines: this.getDefines()
            })),
            this.fullscreenQuad.material = this.materials.addExplodeForce,
            t.uniforms.explodeTex.value = this.textures.explode.texture,
            t.uniforms.particleTex.value = this.textures.particleRead.texture,
            r.render(this.scenes.fullscreen, this.fullscreenCamera, this.textures.particleWrite, !1),
            t.uniforms.particleTex.value = null,
            t.uniforms.explodeTex.value = null,
            this.fullscreenQuad.material = null,
            this.swapTextures("particleRead", "particleWrite")
        },
        saveRendererState: function() {
            this.oldAutoClear = this.renderer.autoClear,
            this.renderer.autoClear = !1,
            this.oldClearColor = this.renderer.getClearColor().getHex(),
            this.oldClearAlpha = this.renderer.getClearAlpha(),
            this.renderer.setClearColor(0, 1)
        },
        restoreRendererState: function() {
            this.renderer.autoClear = this.oldAutoClear,
            this.renderer.setRenderTarget(null),
            this.renderer.setClearColor(this.oldClearColor, this.oldClearAlpha)
        },
        swapTextures: function(e, r) {
            var t = this.textures;
            if (!t[e])
                throw new Error("missing texture " + e);
            if (!t[r])
                throw new Error("missing texture " + r);
            var i = t[e];
            t[e] = t[r],
            t[r] = i
        },
        setSphereRadius: function(e, r) {
            if (0 !== e)
                throw new Error("Multiple spheres not supported yet");
            this.params3.w = r
        },
        getSphereRadius: function(e) {
            if (0 !== e)
                throw new Error("Multiple spheres not supported yet");
            return this.params3.w
        },
        setSpherePosition: function(e, r, t) {
            if (0 !== e)
                throw new Error("Multiple spheres not supported yet");
            this.params3.x = r,
            this.params3.y = t
        },
        getSpherePosition: function(e, r) {
            if (0 !== e)
                throw new Error("Multiple spheres not supported yet");
            r.x = this.params3.x,
            r.y = this.params3.y
        }
    });
    var h, g, y, T, b, P, w, S, I, A, k, M, C, V, D, R, E, F, _, U, G, B, z, L, j, O, q, N, X, W = "\r\n// Convert an index to an UV-coordinate\r\nvec2 indexToUV(float index, vec2 res){\r\n    vec2 uv = vec2(mod(index/res.x,1.0), floor( index/res.y ) / res.x);\r\n    return uv;\r\n}\r\n\r\nuniform sampler2D particleTex;\r\nuniform sampler2D paletteTex;\r\n\r\nuniform float size;\r\nuniform float playerParticleId;\r\nuniform vec2 cameraMin;\r\nuniform vec2 cameraMax;\r\nuniform float time;\r\n\r\n#ifndef USE_VERTEX_POSITION_FOR_PARTICLES\r\nattribute float particleIndex;\r\n#endif\r\nattribute float particleColor;\r\n\r\nvarying vec4 color;\r\n\r\nvoid main() {\r\n\r\n#ifdef USE_VERTEX_POSITION_FOR_PARTICLES\r\n    vec4 particlePosAndVel = vec4(position.xy, vec2(0.0));\r\n#else\r\n    vec2 particleUV = indexToUV(particleIndex,vec2(PARTICLE_RESOLUTION));\r\n    vec4 particlePosAndVel = texture2D(particleTex,particleUV);\r\n#endif\r\n\r\n    vec2 playerParticleUV = indexToUV(playerParticleId,vec2(PARTICLE_RESOLUTION)).xy;\r\n    vec4 playerParticlePosAndVel = texture2D(particleTex,playerParticleUV);\r\n\r\n    color = texture2D(paletteTex,vec2(mod(time,1.0), particleColor));\r\n\r\n    vec2 cameraPos = clamp( playerParticlePosAndVel.xy, cameraMin, cameraMax );\r\n\r\n    vec4 mvPosition = modelViewMatrix * vec4( particlePosAndVel.xy - cameraPos, position.z, 1.0 );\r\n\r\n    gl_PointSize = size;\r\n    gl_Position = projectionMatrix * mvPosition;\r\n}\r\n", Q = "varying vec4 color;\r\nvoid main() {\r\n    if(color.a < 0.01) discard;\r\n    gl_FragColor = color;\r\n}\r\n", H = {
        firstLevel: "mario00",
        levels: {
            loading: {
                backgroundColorPixel: [0, 0],
                music: "",
                cameraBox: {
                    min: {
                        x: 0,
                        y: 0
                    },
                    max: {
                        x: 256,
                        y: 224
                    }
                },
                killBoxes: [],
                portals: [{
                    type: "timer",
                    timeSeconds: 2,
                    destinationLevel: "mario11-part1"
                }],
                gravity: {
                    x: 0,
                    y: 0
                }
            },
            mario00: {
                backgroundColorPixel: [0, 0],
                music: "sound/world-1-1.mp3",
                cameraBox: {
                    min: {
                        x: 0,
                        y: 0
                    },
                    max: {
                        x: 256,
                        y: 240
                    }
                },
                killBoxes: [],
                portals: [{
                    type: "normal",
                    sound: "sound/smb_powerup.mp3",
                    color: [255, 0, 0, 255],
                    destinationLevel: "loading"
                }],
                gravity: {
                    x: 0,
                    y: -.05
                },
                colorAnimations: [{
                    color: [124, 8, 0, 255],
                    animation: [[213, 157, 31, 255], [142, 71, 6, 255], [82, 23, 0, 255], [142, 71, 6, 255], [213, 157, 31, 255], [213, 157, 31, 255], [213, 157, 31, 255], [213, 157, 31, 255]]
                }]
            },
            "mario11-part1": {
                backgroundColorPixel: [0, 0],
                music: "sound/world-1-1.mp3",
                cameraBox: {
                    min: {
                        x: 0,
                        y: 0
                    },
                    max: {
                        x: 1770,
                        y: 240
                    }
                },
                killBoxes: [],
                portals: [{
                    color: [255, 0, 0, 255],
                    type: "pipe",
                    destinationLevel: "mario11-below"
                }, {
                    color: [0, 0, 255, 255],
                    type: "normal",
                    destinationLevel: "mario11-part2"
                }, {
                    type: "die",
                    color: [0, 255, 0, 255],
                    destinationLevel: "mario11-part1"
                }],
                gravity: {
                    x: 0,
                    y: -.05
                },
                colorAnimations: [{
                    color: [255, 165, 66, 255],
                    animation: [[255, 165, 66, 255], [142, 71, 6, 255], [82, 23, 0, 255], [142, 71, 6, 255], [255, 165, 66, 255], [255, 165, 66, 255], [255, 165, 66, 255], [255, 165, 66, 255]]
                }, {
                    color: [255, 0, 0, 255],
                    animation: [[247, 214, 181, 255], [247, 214, 181, 255], [247, 214, 181, 255], [247, 214, 181, 255], [0, 0, 0, 255], [0, 0, 0, 255], [0, 0, 0, 255], [0, 0, 0, 255]]
                }, {
                    color: [255, 255, 0, 255],
                    animation: [[0, 0, 0, 255], [0, 0, 0, 255], [0, 0, 0, 255], [0, 0, 0, 255], [247, 214, 181, 255], [247, 214, 181, 255], [247, 214, 181, 255], [247, 214, 181, 255]]
                }, {
                    color: [0, 255, 0, 255],
                    animation: [[0, 0, 0, 255], [0, 0, 0, 255], [0, 0, 0, 255], [0, 0, 0, 255], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]
                }, {
                    color: [0, 0, 255, 255],
                    animation: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 255], [0, 0, 0, 255], [0, 0, 0, 255], [0, 0, 0, 255]]
                }]
            },
            "mario11-part2": {
                backgroundColorPixel: [0, 0],
                music: "sound/world-1-1.mp3",
                cameraBox: {
                    min: {
                        x: 0,
                        y: 0
                    },
                    max: {
                        x: 1640,
                        y: 240
                    }
                },
                killBoxes: [],
                portals: [{
                    color: [255, 0, 0, 255],
                    type: "normal",
                    destinationLevel: "mario12"
                }, {
                    type: "die",
                    color: [0, 255, 0, 255],
                    destinationLevel: "mario11-part2"
                }],
                gravity: {
                    x: 0,
                    y: -.05
                },
                colorAnimations: [{
                    color: [255, 165, 66, 255],
                    animation: [[255, 165, 66, 255], [142, 71, 6, 255], [82, 23, 0, 255], [142, 71, 6, 255], [255, 165, 66, 255], [255, 165, 66, 255], [255, 165, 66, 255], [255, 165, 66, 255]]
                }]
            },
            "mario11-below": {
                backgroundColorPixel: [0, 0],
                music: "sound/02-underworld.mp3",
                cameraBox: {
                    min: {
                        x: 0,
                        y: 0
                    },
                    max: {
                        x: 256,
                        y: 224
                    }
                },
                killBoxes: [],
                portals: [{
                    color: [255, 0, 0, 255],
                    type: "pipe",
                    destinationLevel: "mario11-part2",
                    destinationPosition: [872, 155]
                }],
                gravity: {
                    x: 0,
                    y: -.05
                },
                colorAnimations: [{
                    color: [252, 152, 56, 255],
                    animation: [[252, 152, 56, 255], [142, 71, 6, 255], [82, 23, 0, 255], [142, 71, 6, 255], [252, 152, 56, 255], [252, 152, 56, 255], [252, 152, 56, 255], [252, 152, 56, 255]]
                }]
            },
            mario12: {
                backgroundColorPixel: [22, 22],
                music: "sound/02-underworld.mp3",
                cameraBox: {
                    min: {
                        x: 0,
                        y: 0
                    },
                    max: {
                        x: 1476,
                        y: 208
                    }
                },
                killBoxes: [],
                portals: [{
                    color: [255, 255, 0, 255],
                    type: "die",
                    destinationLevel: "mario12"
                }, {
                    color: [255, 0, 0, 255],
                    type: "normal",
                    destinationLevel: "mario12-part2"
                }],
                gravity: {
                    x: 0,
                    y: -.05
                },
                colorAnimations: [{
                    color: [252, 152, 56, 255],
                    animation: [[252, 152, 56, 255], [142, 71, 6, 255], [82, 23, 0, 255], [142, 71, 6, 255], [252, 152, 56, 255], [252, 152, 56, 255], [252, 152, 56, 255], [252, 152, 56, 255]]
                }]
            },
            "mario12-part2": {
                backgroundColorPixel: [22, 22],
                music: "sound/02-underworld.mp3",
                cameraBox: {
                    min: {
                        x: 0,
                        y: 0
                    },
                    max: {
                        x: 1615,
                        y: 208
                    }
                },
                killBoxes: [],
                portals: [{
                    color: [255, 0, 0, 255],
                    type: "pipe",
                    destinationLevel: "mario13"
                }, {
                    color: [0, 255, 255, 255],
                    type: "pipe",
                    destinationLevel: "mario12-part2-below"
                }, {
                    color: [0, 255, 0, 255],
                    type: "pipe",
                    destinationLevel: "mario13"
                }, {
                    color: [0, 0, 255, 255],
                    type: "pipe",
                    destinationLevel: "mario13"
                }, {
                    color: [255, 255, 255, 255],
                    type: "pipe",
                    destinationLevel: "mario13"
                }, {
                    color: [255, 255, 0, 255],
                    type: "die",
                    destinationLevel: "mario12-part2"
                }],
                gravity: {
                    x: 0,
                    y: -.05
                }
            },
            "mario12-part2-below": {
                backgroundColorPixel: [22, 22],
                music: "sound/02-underworld.mp3",
                cameraBox: {
                    min: {
                        x: 0,
                        y: 0
                    },
                    max: {
                        x: 272,
                        y: 208
                    }
                },
                killBoxes: [],
                portals: [{
                    color: [255, 0, 0, 255],
                    type: "pipe",
                    destinationLevel: "mario12-part2"
                }],
                gravity: {
                    x: 0,
                    y: -.05
                },
                colorAnimations: [{
                    color: [252, 152, 56, 255],
                    animation: [[252, 152, 56, 255], [142, 71, 6, 255], [82, 23, 0, 255], [142, 71, 6, 255], [252, 152, 56, 255], [252, 152, 56, 255], [252, 152, 56, 255], [252, 152, 56, 255]]
                }]
            },
            mario13: {
                backgroundColorPixel: [22, 22],
                music: "sound/world-1-1.mp3",
                cameraBox: {
                    min: {
                        x: 0,
                        y: 0
                    },
                    max: {
                        x: 2628,
                        y: 240
                    }
                },
                killBoxes: [],
                portals: [{
                    color: [255, 0, 0, 255],
                    type: "die",
                    destinationLevel: "mario13"
                }, {
                    color: [0, 255, 0, 255],
                    type: "normal",
                    destinationLevel: "mario14"
                }],
                gravity: {
                    x: 0,
                    y: -.05
                },
                colorAnimations: [{
                    color: [255, 165, 66, 255],
                    animation: [[255, 165, 66, 255], [142, 71, 6, 255], [82, 23, 0, 255], [142, 71, 6, 255], [255, 165, 66, 255], [255, 165, 66, 255], [255, 165, 66, 255], [255, 165, 66, 255]]
                }]
            },
            mario14: {
                backgroundColorPixel: [0, 60],
                music: "sound/04-castle.mp3",
                cameraBox: {
                    min: {
                        x: 0,
                        y: 0
                    },
                    max: {
                        x: 1168,
                        y: 199
                    }
                },
                killBoxes: [],
                portals: [{
                    color: [255, 0, 0, 255],
                    type: "die",
                    destinationLevel: "mario14"
                }, {
                    color: [0, 255, 0, 255],
                    type: "normal",
                    destinationLevel: "mario14-part2"
                }],
                gravity: {
                    x: 0,
                    y: -.05
                },
                enemyMovement: {
                    type: "rotate",
                    magnitude: .1,
                    frequency: .25
                },
                colorAnimations: [{
                    color: [255, 165, 66, 255],
                    animation: [[255, 165, 66, 255], [142, 71, 6, 255], [82, 23, 0, 255], [142, 71, 6, 255], [255, 165, 66, 255], [255, 165, 66, 255], [255, 165, 66, 255], [255, 165, 66, 255]]
                }]
            },
            "mario14-part2": {
                backgroundColorPixel: [0, 60],
                music: "sound/04-castle.mp3",
                cameraBox: {
                    min: {
                        x: 0,
                        y: 0
                    },
                    max: {
                        x: 2554,
                        y: 199
                    }
                },
                killBoxes: [],
                portals: [{
                    color: [0, 255, 0, 255],
                    type: "normal",
                    destinationLevel: "end-alpha"
                }, {
                    color: [0, 0, 255, 255],
                    type: "explosionTrigger",
                    explodeParticle: [923, 136]
                }],
                gravity: {
                    x: 0,
                    y: -.05
                },
                enemyMovement: {
                    type: "rotate",
                    magnitude: .1,
                    frequency: 1
                },
                colorAnimations: [{
                    color: [255, 165, 66, 255],
                    animation: [[255, 165, 66, 255], [142, 71, 6, 255], [82, 23, 0, 255], [142, 71, 6, 255], [255, 165, 66, 255], [255, 165, 66, 255], [255, 165, 66, 255], [255, 165, 66, 255]]
                }]
            },
            "end-alpha": {
                backgroundColorPixel: [0, 0],
                music: "sound/smb_stage_clear.mp3",
                cameraBox: {
                    min: {
                        x: 0,
                        y: 0
                    },
                    max: {
                        x: 256,
                        y: 224
                    }
                },
                killBoxes: [],
                portals: [],
                gravity: {
                    x: 0,
                    y: -.05
                }
            }
        },
        sfx: ["sound/jump.mp3", "sound/smb_1-up.mp3", "sound/smb_bowserfalls.mp3", "sound/smb_bowserfire.mp3", "sound/smb_breakblock.mp3", "sound/smb_bump.mp3", "sound/smb_coin.mp3", "sound/smb_fireball.mp3", "sound/smb_fireworks.mp3", "sound/smb_flagpole.mp3", "sound/smb_gameover.mp3", "sound/smb_jump-small.mp3", "sound/smb_jump-super.mp3", "sound/smb_kick.mp3", "sound/smb_mariodie.mp3", "sound/smb_pause.mp3", "sound/smb_pipe.mp3", "sound/smb_powerup_appears.mp3", "sound/smb_powerup.mp3", "sound/smb_stage_clear.mp3", "sound/smb_stomp.mp3", "sound/smb_vine.mp3", "sound/smb_warning.mp3", "sound/smb_world_clear.mp3"],
        music: {
            "sound/world-1-1.mp3": {
                loopEnd: 125.7,
                loopStart: .9
            },
            "sound/02-underworld.mp3": {
                loopEnd: 50,
                loopStart: .1
            },
            "sound/04-castle.mp3": {
                loopEnd: 48.6,
                loopStart: .6
            }
        }
    }, K = -1 !== location.search.indexOf("debug"), Y = document.getElementById("container"), Z = [], J = [], $ = 0;
    function ee(e, r, t) {
        if (e && ne) {
            t = t || 0;
            var i = .6 + r;
            i = f(i, 0, 1),
            e.playbackRate.linearRampToValueAtTime(i, ne.currentTime + t)
        }
    }
    var re, te, ie, ne, ae, oe = !1, se = 0, le = 0;
    function ce() {
        se++
    }
    function de() {
        le++,
        document.getElementById("loadedPercent").innerText = parseInt(le / se * 100, 10)
    }
    var ue = {};
    var pe, me, xe, fe = {};
    if (me = !1,
    pe = navigator.userAgent || navigator.vendor || window.opera,
    (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(pe) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(pe.substr(0, 4))) && (me = !0),
    me)
        (he = document.getElementById("mobile-info")).style.display = "flex",
        he.innerHTML += '<p><img src="jelly-mario.gif" width="60%"></p>';
    else if (function() {
        var e = !1;
        try {
            var r = document.createElement("canvas");
            e = !(!window.WebGLRenderingContext || !r.getContext("webgl") && !r.getContext("experimental-webgl"))
        } catch (r) {
            e = !1
        }
        if (!e)
            return !1;
        var t = (r = document.createElement("canvas")).getContext("webgl") || r.getContext("experimental-webgl")
          , i = t.createTexture();
        if (null === t.getExtension("OES_texture_float"))
            return !1;
        t.bindTexture(t.TEXTURE_2D, i),
        t.texImage2D(t.TEXTURE_2D, 0, t.RGBA, 2, 2, 0, t.RGBA, t.FLOAT, null),
        t.texParameteri(t.TEXTURE_2D, t.TEXTURE_MAG_FILTER, t.LINEAR),
        t.texParameteri(t.TEXTURE_2D, t.TEXTURE_MIN_FILTER, t.LINEAR);
        var n = t.createFramebuffer();
        t.bindFramebuffer(t.FRAMEBUFFER, n),
        t.framebufferTexture2D(t.FRAMEBUFFER, t.COLOR_ATTACHMENT0, t.TEXTURE_2D, i, 0);
        var a = t.checkFramebufferStatus(t.FRAMEBUFFER) === t.FRAMEBUFFER_COMPLETE;
        return t.deleteTexture(i),
        t.deleteFramebuffer(n),
        t.bindTexture(t.TEXTURE_2D, null),
        t.bindFramebuffer(t.FRAMEBUFFER, null),
        a
    }()) {
        var ve = document.getElementById("loading");
        Promise.all([function() {
            var e = [];
            Object.keys(H.levels).forEach(r => {
                e.push(r + ".png", r + "-mass.png", r + "-groups.png", r + "-depth.png", r + "-triggers.png")
            }
            );
            var r = e.map(e => (function(e) {
                return function(e) {
                    return ce(),
                    new Promise(function(r, t) {
                        var i = new Image;
                        i.onload = function() {
                            de(),
                            fe[e] = i,
                            r(i)
                        }
                        ,
                        i.onerror = function() {
                            t()
                        }
                        ,
                        i.src = e
                    }
                    )
                }(e)
            }
            )(e));
            return Promise.all(r)
        }(), function() {
            var e = window.AudioContext || window.webkitAudioContext || !1;
            if (!e)
                return Promise.reject(new Error("WebAudio not supported."));
            ne = new e,
            (ae = ne.createGain()).gain.setValueAtTime(1, ne.currentTime),
            ae.connect(ne.destination);
            var r = document.getElementById("toggleSoundCheckbox");
            r.checked = "running" === ne.state,
            r.onchange = function() {
                var e = !!document.querySelector("#toggleSoundCheckbox:checked");
                ae.gain.setValueAtTime(e ? 1 : 0, ne.currentTime)
            }
            ,
            r.onclick = function() {
                "running" !== ne.state && ne.resume()
            }
            ;
            var t = Object.keys(H.levels).map(e => H.levels[e].music).filter(e => !!e);
            t = H.sfx.concat(t);
            var i = (t = Array.from(new Set(t))).map(e => (function(e) {
                return ue[e] ? Promise.resolve(ue[e]) : (ce(),
                fetch(e).then(e => e.arrayBuffer()).then(e => new Promise(function(r, t) {
                    ne.decodeAudioData(e, r, t)
                }
                )).then(r => {
                    ue[e] = r,
                    de()
                }
                ))
            }
            )(e));
            return Promise.all(i)
        }()]).then(function() {
            if ("running" === ne.state)
                return Promise.resolve();
            var e = document.getElementById("play")
              , r = document.getElementById("playButton");
            return e.style.display = "",
            ve.style.display = "none",
            new Promise(function(t, i) {
                r.addEventListener("click", function() {
                    ne.resume(),
                    t(),
                    e.style.display = "none"
                })
            }
            )
        }).then(function() {
            !function() {
                (y = new e.WebGLRenderer).setPixelRatio(1),
                Y.appendChild(y.domElement),
                window.addEventListener("resize", Ie, !1),
                h = new e.Scene,
                C = new e.Vector2(512,512),
                w = new c({
                    maxSubSteps: 1,
                    gravity: new e.Vector2(0,-.05),
                    renderer: y,
                    maxParticles: 65536,
                    radius: .003,
                    stiffness: 3e3,
                    damping: 6,
                    fixedTimeStep: 1 / 120,
                    friction: 4,
                    drag: .1,
                    gridResolution: C,
                    onpoststep: function() {
                        $++
                    }
                }),
                I = 4 * w.maxParticles,
                K && (window.world = w);
                w.radius;
                var r = 256 * w.radius;
                (g = new e.OrthographicCamera(-1,1,1,-1,.1,50)).position.z = r / 2,
                h.add(g),
                function() {
                    for (var r = new e.ShaderMaterial({
                        uniforms: {
                            particleTex: {
                                value: null
                            },
                            paletteTex: {
                                value: V
                            },
                            size: {
                                value: we()
                            },
                            playerParticleId: {
                                value: re
                            },
                            cameraMin: {
                                value: new e.Vector2
                            },
                            cameraMax: {
                                value: new e.Vector2
                            },
                            time: {
                                value: 0
                            }
                        },
                        vertexShader: W,
                        fragmentShader: Q,
                        defines: {
                            PARTICLE_RESOLUTION: w.particleTextureSize
                        }
                    }), t = new Float32Array(w.maxParticles), i = 0; i < w.maxParticles; i++)
                        t[i] = i;
                    var n = new Float32Array(w.maxParticles)
                      , a = new Float32Array(3 * w.maxParticles)
                      , o = new e.BufferGeometry;
                    o.addAttribute("position", new e.BufferAttribute(a,3)).addAttribute("particleIndex", new e.BufferAttribute(t,1)).addAttribute("particleColor", new e.BufferAttribute(n,1)),
                    (A = new e.Points(o,r)).frustumCulled = !1,
                    h.add(A)
                }(),
                t = new e.ShaderMaterial({
                    uniforms: {
                        particleTex: {
                            value: null
                        },
                        paletteTex: {
                            value: V
                        },
                        size: {
                            value: we()
                        },
                        playerParticleId: {
                            value: re
                        },
                        cameraMin: {
                            value: new e.Vector2
                        },
                        cameraMax: {
                            value: new e.Vector2
                        },
                        time: {
                            value: 0
                        }
                    },
                    vertexShader: W,
                    fragmentShader: Q,
                    defines: {
                        PARTICLE_RESOLUTION: w.particleTextureSize,
                        USE_VERTEX_POSITION_FOR_PARTICLES: 1
                    }
                }),
                i = new Float32Array(I),
                n = new Float32Array(3 * I),
                a = new e.BufferGeometry,
                a.addAttribute("position", new e.BufferAttribute(n,3)).addAttribute("particleColor", new e.BufferAttribute(i,1)),
                (k = new e.Points(a,t)).frustumCulled = !1,
                h.add(k),
                0,
                z = {
                    38: 0,
                    40: 0,
                    39: 0,
                    37: 0,
                    87: 0,
                    65: 0,
                    83: 0,
                    68: 0,
                    32: 0
                },
                window.addEventListener("keydown", function(e) {
                    if (0 === z[e.keyCode])
                        switch (e.keyCode) {
                        case 38:
                            w.time;
                            break;
                        case 32:
                            Ve || w.explodeParticle(re)
                        }
                    z[e.keyCode] = 1,
                    Ee()
                }),
                window.addEventListener("keyup", function(e) {
                    0 === z[e.keyCode] && 38 === e.keyCode && w.time,
                    z[e.keyCode] = 0,
                    Ee()
                }),
                function() {
                    var r = new e.Vector2
                      , t = {
                        mousedown: function() {},
                        mousemove: function(e) {
                            var t = y.domElement.getBoundingClientRect();
                            r.set(e.pageX - t.left, e.pageY - t.top),
                            r.x /= t.width,
                            r.y /= t.height
                        },
                        mousup: function() {}
                    };
                    for (var i in t)
                        window.addEventListener(i, t[i])
                }(),
                Ie();
                var t, i, n, a
            }();
            var i = H.firstLevel;
            if (K) {
                var n = location.search.match(/level=([\-a-zA-Z0-9]+)/);
                n && (i = n[1])
            }
            for (var a in Te(i),
            Se(),
            w.singleStep(),
            w.materials) {
                var o = w.materials[a].program.diagnostics;
                if (o && !o.runnable)
                    throw new Error("Could not compile shaders.")
            }
            ve.style.display = "none",
            function() {
                if (!K)
                    return;
                (T = new r).domElement.style.position = "absolute",
                T.domElement.style.top = "0px",
                Y.appendChild(T.domElement),
                S = {
                    paused: !1,
                    gravity: w.gravity.y,
                    level: R,
                    zoom: 1,
                    debugTimeScale: 1
                },
                (b = new t.GUI).add(w, "stiffness", 0, 5e3, .1),
                b.add(w, "damping", 0, 100, .1),
                b.add(w, "drag", 0, 1, .01),
                b.add(w, "friction", 0, 10, .001),
                b.add(w, "fixedTimeStep", .001, .1, .001),
                b.add(S, "debugTimeScale", 0, 5, .01),
                b.add(S, "paused"),
                b.add(S, "gravity", -2, 2, .001).onChange(function(e) {
                    w.gravity.y = e
                }),
                b.add(S, "level", Object.keys(H.levels)).onChange(function(e) {
                    Te(e),
                    Se()
                }),
                b.add(S, "zoom", 1, 5, .01).onChange(Ie)
            }(),
            requestAnimationFrame(ke)
        }).catch(function(e) {
            throw ve.innerText = "Something went wrong :(",
            e
        })
    } else {
        var he = document.getElementById("mobile-info");
        document.getElementById("mobile-info-message").innerText = "It seems like your device doesn't support WebGL. Sorry!",
        he.style.display = "flex",
        he.innerHTML += '<p><img src="jelly-mario.gif" width="60%"></p>'
    }
    function ge(e, r, t, i) {
        e[0] = r[0] * w.radius * 2,
        e[1] = 2 * w.radius * i - r[1] * w.radius * 2
    }
    function ye(r, t, i, n) {
        this.min = new e.Vector2(r,t),
        this.max = new e.Vector2(i,n)
    }
    function Te(r, t) {
        if (R = r,
        E = fe[r + ".png"],
        F = fe[r + "-mass.png"],
        _ = fe[r + "-groups.png"],
        U = fe[r + "-depth.png"],
        G = fe[r + "-triggers.png"],
        K) {
            var i = [E, F, _, U, G];
            if (!i.map(e => e.width === E.width && e.height === E.height).reduce( (e, r) => e && r)) {
                var n = i.map(e => e.src + ": " + e.width + "x" + e.height).join("\n");
                throw new Error("image dimensions not equal!\n" + n)
            }
        }
        window.ga && window.ga("send", {
            hitType: "event",
            eventCategory: "LevelStarts",
            eventAction: "initLevel_" + r,
            eventLabel: "LabelName"
        }),
        window.gtag && window.gtag("event", "screen_view", {
            app_name: "jellymar.io",
            screen_name: r
        }),
        function(e) {
            return O && ue[H.levels[e].music] == O.buffer
        }(r) || be(),
        w.reset(),
        w.gravity.copy(H.levels[r].gravity),
        w.applyForceMask2.set(0, 0, 0, 1),
        w.applyForce2.set(-.03, 0),
        xe = 0,
        j = -100,
        D = new Float32Array(4),
        w.boxMin.set(0, 0),
        w.boxMax.set(2 * w.radius * E.width, 2 * w.radius * E.height),
        P = E.height;
        var a = Pe(E)
          , o = Pe(_)
          , s = Pe(F)
          , l = Pe(U)
          , c = Pe(G)
          , d = new Uint32Array(a.buffer)
          , u = new Uint32Array(o.buffer)
          , p = new Uint32Array(s.buffer);
        B = new Uint32Array(c.buffer);
        for (var m = [0, 0, 0, 0], x = 4 * (H.levels[r].backgroundColorPixel[0] + E.width * H.levels[r].backgroundColorPixel[1]), f = 0; f < 4; f++)
            m[f] = a[f + x];
        K && console.log(m),
        M = [];
        var h = Array.from(new Set(oe ? u : d))
          , g = new Map;
        function T(e, r) {
            return [e, r].join("_")
        }
        var b = new Uint32Array(E.width * E.height);
        console.log(4 * b.length / 1048576);
        var S = new Map;
        1,
        2,
        2,
        4,
        8,
        2,
        2,
        w.applyGravityMask.set(0, 0, 1, 1),
        S.set(4278190335, 2),
        S.set(4278255360, 1),
        S.set(4294901760, 6),
        S.set(4294967295, 10),
        S.set(4278255615, 2);
        var I = new e.Vector2(1e4,1e4)
          , A = new e.Vector2(-1e4,-1e4)
          , k = []
          , C = 0;
        for (f = 0; f < E.width; f++)
            for (var z = 0; z < E.height; z++) {
                var W = a[(ce = 4 * (Fe = z * E.width + f)) + 0]
                  , Q = a[ce + 1]
                  , Y = a[ce + 2]
                  , $ = a[ce + 3];
                if (W !== m[0] || Q !== m[1] || Y !== m[2]) {
                    var se = u[Fe];
                    if (6 === (Te = S.get(se)))
                        I.set(Math.min(f, I.x), Math.min(z, I.y)),
                        A.set(Math.max(f, A.x), Math.max(z, A.y));
                    else if (4278255615 === se) {
                        var le = !1;
                        k.forEach(function(e) {
                            e.contains(f, z) && (le = !0),
                            e.max.x + 1 === f ? (e.max.x++,
                            le = !0) : e.min.x - 1 === f && (e.min.x--,
                            le = !0),
                            e.max.y + 1 === z ? (e.max.y++,
                            le = !0) : e.min.y - 1 === z && (e.min.y--,
                            le = !0)
                        }),
                        le || k.push(new ye(f,z,f,z))
                    }
                    S.has(se) && C++
                }
            }
        console.log(k),
        K && console.log("Using " + v(C, w.maxParticles) + "% of particle texture"),
        J.length = 0;
        for (f = 0; f < E.width; f++)
            for (z = 0; z < E.height; z++) {
                w.particleCount % 255 == 0 && w.addParticle(-100, -100, 0, 0, 0);
                var ce;
                W = a[(ce = 4 * (Fe = z * E.width + f)) + 0],
                Q = a[ce + 1],
                Y = a[ce + 2],
                $ = a[ce + 3];
                if (W !== m[0] || Q !== m[1] || Y !== m[2]) {
                    var de = 1;
                    4278190080 == p[Fe] && (de = 0);
                    var pe = [0, 0];
                    ge(pe, [f, z], E.width, E.height);
                    var me = d[Fe];
                    se = u[Fe];
                    oe && (me = se);
                    var ve = (h.indexOf(me) + .5) / h.length
                      , he = l[ce] / 255 * .01;
                    if (S.has(se)) {
                        var Te = S.get(se)
                          , we = w.addParticle(pe[0], pe[1], de, Te);
                        void 0 !== we && (g.set(T(f, z), we),
                        b[f + z * E.width] = we,
                        M[we] = ve,
                        Z[we] = he)
                    } else
                        0 !== $ && J.push(pe[0], pe[1], he, ve)
                }
            }
        g.forEach(function(e, r) {
            var t, i = parseInt(r.split("_")[0], 10), n = parseInt(r.split("_")[1], 10);
            i > 44 && i < 48 && n > 15 && n < 19 || (void 0 !== (t = g.get(T(i, n + 1))) && w.connectParticles(e, t, !1),
            void 0 !== (t = g.get(T(i, n - 1))) && w.connectParticles(e, t, !1),
            void 0 !== (t = g.get(T(i + 1, n))) && w.connectParticles(e, t, !1),
            void 0 !== (t = g.get(T(i - 1, n))) && w.connectParticles(e, t, !1),
            void 0 !== (t = g.get(T(i - 1, n - 1))) && w.connectParticles(e, t, !0),
            void 0 !== (t = g.get(T(i + 1, n + 1))) && w.connectParticles(e, t, !0),
            void 0 !== (t = g.get(T(i - 1, n + 1))) && w.connectParticles(e, t, !0),
            void 0 !== (t = g.get(T(i + 1, n - 1))) && w.connectParticles(e, t, !0))
        }),
        L = new Map,
        H.levels[r].portals.forEach(function(e) {
            if ("explosionTrigger" === e.type) {
                var r = g.get(T(e.explodeParticle[0], e.explodeParticle[1]));
                if (r) {
                    var t = new Uint32Array(new Uint8Array(e.color).buffer)[0];
                    L.set(t, r)
                }
            }
        });
        var Se = Math.floor((A.x + I.x - 1) / 2)
          , Ie = Math.floor((A.y + I.y + 1) / 2);
        re = g.get(T(Se, Ie)),
        w.centerParticleIndex = re,
        w.applyTorqueMaskAndCenterParticleId.set(0, 0, 1, re),
        K && console.log("Player particle: " + re);
        var Ae = Math.floor((A.x + I.x) / 2)
          , ke = A.y - 8
          , Me = I.y + 10;
        te = g.get(T(Ae, ke)),
        ie = g.get(T(Ae, Me)),
        te && ie || (console.error("Stretch particle not found!"),
        te = ie = -1),
        q = [],
        N = A.x - I.x + 1,
        X = A.y - I.y + 1;
        for (var Ce = I.y; Ce <= A.y; Ce++)
            for (var Ve = I.x; Ve <= A.x; Ve++) {
                var De = g.get(T(Ve, Ce)) || -1;
                q.push(De)
            }
        var Re = new e.Color("rgb(" + m.join(",") + ")").getHex();
        y.setClearColor(Re, 1),
        V = new e.DataTexture(new Uint8Array(4 * h.length * 8),8,h.length,e.RGBAFormat);
        var Ee = H.levels[r].colorAnimations || [];
        h.forEach(function(e, r) {
            var t = 255 & e
              , i = e >> 8 & 255
              , n = e >> 16 & 255
              , a = e >> 24 & 255
              , o = Ee.find(function(e) {
                return e.color[0] === t && e.color[1] === i && e.color[2] === n && e.color[3] === a
            });
            if (o)
                o.animation.forEach(function(e, t) {
                    V.image.data[4 * (8 * r + t) + 0] = e[0],
                    V.image.data[4 * (8 * r + t) + 1] = e[1],
                    V.image.data[4 * (8 * r + t) + 2] = e[2],
                    V.image.data[4 * (8 * r + t) + 3] = e[3]
                });
            else
                for (var s = 0; s < 8; s++)
                    V.image.data[4 * (8 * r + s) + 0] = t,
                    V.image.data[4 * (8 * r + s) + 1] = i,
                    V.image.data[4 * (8 * r + s) + 2] = n,
                    V.image.data[4 * (8 * r + s) + 3] = a
        }),
        V.needsUpdate = !0;
        var Fe, _e = 0;
        (k.forEach(function(e) {
            var r = e.getIntegerCenter()
              , t = b[r.x + r.y * E.width];
            t && (w.particleTrackedIndices[_e++] = t)
        }),
        t) && (ge(Fe = [0, 0], t, E.width, E.height),
        w.singleStep(),
        function(e, r) {
            for (var t = [], i = [], n = 0; n < X; n++)
                for (var a = 0; a < N; a++) {
                    var o = q[N * n + a];
                    o >= 0 && (t.push(o),
                    i.push({
                        x: e + (a - (N - 1) / 2) * w.radius * 2,
                        y: r - (n - (X - 1) / 2) * w.radius * 2
                    }))
                }
            w.setPositions(t, i)
        }(Fe[0], Fe[1]));
        !function(e) {
            if (!O && H.levels[e].music.length) {
                O = ne.createBufferSource();
                var r = H.levels[e].music;
                O.buffer = ue[r],
                O.connect(ae),
                O.loop = !0,
                H.music[r] && (O.loopEnd = H.music[r].loopEnd,
                O.loopStart = H.music[r].loopStart),
                O.start(ne.currentTime, O.loopStart),
                ee(O, 0)
            }
        }(r),
        g = null
    }
    function be() {
        O && (O.disconnect(ae),
        O = null)
    }
    function Pe(e) {
        var r = document.createElement("canvas");
        r.width = e.width,
        r.height = e.height;
        var t = r.getContext("2d");
        return t.mozImageSmoothingEnabled = !1,
        t.webkitImageSmoothingEnabled = !1,
        t.msImageSmoothingEnabled = !1,
        t.imageSmoothingEnabled = !1,
        t.drawImage(e, 0, 0, e.width, e.height),
        t.getImageData(0, 0, e.width, e.height).data
    }
    function we() {
        var e = y.domElement.height / (g.top - g.bottom);
        return 2.5 * w.radius * e
    }
    function Se() {
        k.material.uniforms.size.value = A.material.uniforms.size.value = we(),
        k.material.uniforms.playerParticleId.value = A.material.uniforms.playerParticleId.value = re,
        k.material.uniforms.paletteTex.value = A.material.uniforms.paletteTex.value = V,
        Ae();
        for (var e = 0; e < w.particleCount; e++)
            A.geometry.attributes.particleColor.array[e] = M[e],
            A.geometry.attributes.position.array[3 * e + 0] = 0,
            A.geometry.attributes.position.array[3 * e + 1] = 0,
            A.geometry.attributes.position.array[3 * e + 2] = Z[e];
        K && console.log("Using " + v(J.length / 4, I) + "% of static particles");
        for (e = 0; e < I; e++)
            if (4 * e < J.length) {
                var r = J[4 * e]
                  , t = J[4 * e + 1]
                  , i = J[4 * e + 2]
                  , n = J[4 * e + 3];
                k.geometry.attributes.particleColor.array[e] = n,
                k.geometry.attributes.position.array[3 * e + 0] = r,
                k.geometry.attributes.position.array[3 * e + 1] = t,
                k.geometry.attributes.position.array[3 * e + 2] = i
            } else
                k.geometry.attributes.position.array[3 * e + 0] = 0,
                k.geometry.attributes.position.array[3 * e + 1] = 0;
        for (var a in J.length = 0,
        A.geometry.attributes)
            A.geometry.attributes[a].needsUpdate = !0;
        for (var a in k.geometry.attributes)
            k.geometry.attributes[a].needsUpdate = !0
    }
    function Ie() {
        var e = 480 * w.radius
          , r = 512 * w.radius;
        S && (r /= S.zoom,
        e /= S.zoom);
        var t = 0 * w.radius;
        g.left = (r - t) / -2,
        g.right = (r - t) / 2,
        g.top = (e - t) / 2,
        g.bottom = (e - t) / -2,
        g.updateProjectionMatrix();
        var i = Y.getBoundingClientRect()
          , n = i.width
          , a = i.height;
        n / a > 256 / 240 ? y.setSize(256 / 240 * a, a) : y.setSize(n, n / (256 / 240)),
        k.material.uniforms.size.value = A.material.uniforms.size.value = we(),
        Ae()
    }
    function Ae() {
        var e = g.right - g.left
          , r = g.top - g.bottom
          , t = A.material.uniforms.cameraMin.value
          , i = A.material.uniforms.cameraMax.value;
        if (t.set(0, 0),
        i.set(255, 255),
        R) {
            t.copy(H.levels[R].cameraBox.min),
            i.copy(H.levels[R].cameraBox.max);
            var n = t.y;
            t.y = P - i.y,
            i.y = P - n
        }
        t.multiplyScalar(2 * w.radius),
        i.multiplyScalar(2 * w.radius),
        t.set(t.x + e / 2, t.y + r / 2),
        i.set(i.x - e / 2, i.y - r / 2),
        t.x > i.x && (t.x = i.x = .5 * (t.x + i.x)),
        t.y > i.y && (t.y = i.y = .5 * (t.y + i.y)),
        k.material.uniforms.cameraMin.value.copy(t),
        k.material.uniforms.cameraMax.value.copy(i)
    }
    function ke(r) {
        requestAnimationFrame(ke),
        function(e) {
            w.time - j > .3 && (w.params4.y = 0);
            var r = H.levels[R].enemyMovement;
            if (r)
                if ("rotate" == r.type) {
                    var t = r.magnitude
                      , i = r.frequency;
                    w.applyForce2.set(Math.sin(i * w.time), Math.cos(i * w.time)).multiplyScalar(t)
                } else if ("leftright" == r.type) {
                    var t = r.magnitude
                      , i = r.frequency;
                    w.applyForce2.set(Math.floor(i * w.time) % 2 * 2 - 1, 0).multiplyScalar(t)
                }
            var n = void 0 === Me ? 0 : (e - Me) / 1e3;
            n *= 1.1,
            S && (n *= S.debugTimeScale);
            S && S.paused || (w.step(n),
            w.maxSubSteps = $ > 60 ? 7 : 1);
            Me = e
        }(r),
        k.material.uniforms.particleTex.value = A.material.uniforms.particleTex.value = w.particleTexture,
        k.material.uniforms.time.value = A.material.uniforms.time.value = w.time,
        y.render(h, g),
        function() {
            var r = w.time;
            if (r - xe < .5)
                return;
            if (xe = r,
            Ve || De)
                return;
            if (w.hasExploded())
                return Ve = !0,
                Ee(),
                be(),
                void _e("sound/smb_fireworks.mp3", function() {
                    setTimeout(function() {
                        _e("sound/smb_mariodie.mp3", function() {
                            w.clearExploded(),
                            Ve = !1,
                            Te(R),
                            Se()
                        })
                    }, 1e3)
                });
            var t = H.levels[R].portals.find(e => "timer" === e.type);
            if (t)
                null === Ce ? Ce = r : r - Ce > t.timeSeconds && (Te(t.destinationLevel),
                Se());
            else {
                w.readParticleData(re, D),
                ee(O, Re(), 1);
                var i = new e.Vector2(f(Math.floor(D[0] / (2 * w.radius)), 0, G.width),f(G.height - Math.floor(D[1] / (2 * w.radius)), 0, G.width))
                  , n = B[i.x + G.width * i.y]
                  , a = null;
                if (H.levels[R].portals.forEach(function(e) {
                    var r = new Uint32Array(new Uint8Array(e.color).buffer);
                    n === r[0] && (a = e)
                }),
                a && "die" === a.type)
                    return void w.explodeParticle(re);
                if (a) {
                    var o = function() {
                        Te(a.destinationLevel, a.destinationPosition),
                        Se(),
                        De = !1
                    };
                    if ("pipe" === a.type)
                        De = !0,
                        _e("sound/smb_pipe.mp3", o);
                    else if ("explosionTrigger" === a.type) {
                        var s = L.get(n);
                        s && (w.explodeParticle(s),
                        w.singleStep(),
                        w.clearExploded(),
                        L.set(n, 0))
                    } else
                        a.sound ? (De = !0,
                        _e(a.sound, o)) : (De = !0,
                        o())
                }
            }
        }(),
        void 0 !== T && T.update()
    }
    ye.prototype = {
        contains: function(e, r) {
            return e <= this.max.x && r <= this.max.y && e >= this.min.x && r >= this.min.y
        },
        getCenter: function() {
            return new e.Vector2((this.max.x + this.min.x) / 2,(this.max.y + this.min.y) / 2)
        },
        getIntegerCenter: function() {
            var e = this.getCenter();
            return e.x = Math.floor(e.x),
            e.y = Math.floor(e.y),
            e
        }
    };
    var Me, Ce = null, Ve = !1, De = !1;
    function Re() {
        return Math.sqrt(Math.pow(D[2], 2), Math.pow(D[3], 2))
    }
    function Ee() {
        if (Ve)
            w.applyForce.set(0, 0),
            w.params4.set(0, 0, 0, 0);
        else {
            w.params4.x = -1.2 * (z[39] - z[37]),
            w.applyForceMask.set(0, 0, 1, 0),
            w.applyForce.set(.1 * (z[39] - z[37]), 0 * (z[38] - z[40])),
            w.time - j > 1 && z[38] && (w.params4.y = -.5 * Math.min(0, -(z[38] - z[40])),
            w.params4.z = re,
            w.params4.w = ie,
            j = w.time,
            _e("sound/jump.mp3"))
        }
    }
    var Fe = {};
    function _e(e, r) {
        Fe[e] && Fe[e].disconnect(ae);
        var t = ne.createBufferSource();
        ee(t, Re()),
        t.buffer = ue[e],
        t.connect(ae),
        r && (t.onended = r),
        t.start(),
        Fe[e] = t
    }
}(THREE, Stats, dat);