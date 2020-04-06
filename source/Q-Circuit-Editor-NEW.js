
//  Copyright © 2019–2020, Stewart Smith. See LICENSE for details.




Q.Circuit.Editor = function( circuit, targetEl ){


	//  First order of business,
	//  we require a valid circuit.

	if( circuit instanceof Q.Circuit !== true ) return
	this.circuit = circuit
	this.index = Q.Circuit.Editor.index ++


	//  Q.Circuit.Editor is all about the DOM
	//  so we’re going to get som use out of this
	//  stupid (but convenient) shorthand here.

	const createDiv = function(){

		return document.createElement( 'div' )
	}


	//  ++++++++++++++++++
	//  The nature of the domId needs to be better thought out!
	//  Check for name collisions beforehand???
	//  What’s the contingency??

	const
	name  = typeof circuit.name === 'string' ? circuit.name : 'Q-editor-'+ this.index,
	domId = name.replace( /^[^a-z]+|[^\w:.-]+/gi, '' )
	
	this.name  = name
	this.domId = domId



	//  If we’ve been passed a target DOM element
	//  we should use that as our circuit element.

	if( typeof targetEl === 'string' ) targetEl = document.getElementById( targetEl )	
	const circuitEl = targetEl instanceof HTMLElement ? targetEl : createDiv()
	this.domElement = circuitEl
	circuitEl.classList.add( 'Q-circuit' )
	circuitEl.setAttribute( 'id', this.domId )
	circuitEl.circuit = circuit


	//  Toolbar.

	const toolbarEl = createDiv()
	circuitEl.appendChild( toolbarEl )
	toolbarEl.classList.add( 'Q-circuit-toolbar' )

	const modeButton = createDiv()
	toolbarEl.appendChild( modeButton )
	modeButton.classList.add( 'Q-circuit-button', 'Q-circuit-button-select-toggle' )
	modeButton.setAttribute( 'title', 'Selection mode' )
	modeButton.innerText = 'S'

	const undoButton = createDiv()
	toolbarEl.appendChild( undoButton )
	undoButton.classList.add( 'Q-circuit-button', 'Q-circuit-button-undo' )
	undoButton.setAttribute( 'title', 'Undo' )
	undoButton.innerHTML = '&larr;'

	const redoButton = createDiv()
	toolbarEl.appendChild( redoButton )
	redoButton.classList.add( 'Q-circuit-button', 'Q-circuit-button-redo' )
	redoButton.setAttribute( 'title', 'Redo' )
	redoButton.innerHTML = '&rarr;'


	//  Create a circuit board container
	//  so we can house a scrollable circuit board.

	const boardContainerEl = createDiv()
	circuitEl.appendChild( boardContainerEl )
	boardContainerEl.classList.add( 'Q-circuit-board-container' )
	boardContainerEl.addEventListener( 'touchstart', Q.Circuit.Editor.onPointerPress )	

	const boardEl = createDiv()
	boardContainerEl.appendChild( boardEl )
	boardEl.classList.add( 'Q-circuit-board' )

	const backgroundEl = createDiv()
	boardEl.appendChild( backgroundEl )
	backgroundEl.classList.add( 'Q-circuit-board-background' )


	//  Create background highlight bars 
	//  for each row.

	for( let i = 0; i < circuit.bandwidth; i ++ ){

		const rowEl = createDiv()
		backgroundEl.appendChild( rowEl )
		rowEl.style.position = 'relative'
		rowEl.style.gridRowStart = i + 2
		rowEl.style.gridColumnStart = 1
		rowEl.style.gridColumnEnd = Q.Circuit.Editor.momentIndexToGridColumn( circuit.timewidth ) + 1
		rowEl.setAttribute( 'register-index', i + 1 )

		const wireEl = createDiv()
		rowEl.appendChild( wireEl )
		wireEl.classList.add( 'Q-circuit-register-wire' )
	}


	//  Create background highlight bars 
	//  for each column.

	for( let i = 0; i < circuit.timewidth; i ++ ){

		const columnEl = createDiv()
		backgroundEl.appendChild( columnEl )
		columnEl.style.gridRowStart = 2
		columnEl.style.gridRowEnd = Q.Circuit.Editor.registerIndexToGridRow( circuit.bandwidth ) + 1
		columnEl.style.gridColumnStart = i + 3
		columnEl.setAttribute( 'moment-index', i + 1 )
	}


	//  Create the circuit board foreground
	//  for all interactive elements.

	const foregroundEl = createDiv()
	boardEl.appendChild( foregroundEl )
	foregroundEl.classList.add( 'Q-circuit-board-foreground' )


	//  Add a toggle switch for locking the circuit.

	const lockToggle = createDiv()
	foregroundEl.appendChild( lockToggle )
	lockToggle.classList.add( 'Q-circuit-header', 'Q-circuit-toggle', 'Q-circuit-toggle-lock' )
	lockToggle.setAttribute( 'title', 'Lock / unlock' )
	lockToggle.innerText = '🔓'


	//  Add “Select All” toggle button to upper-left corner.

	const selectallEl = createDiv()
	foregroundEl.appendChild( selectallEl )
	selectallEl.classList.add( 'Q-circuit-header', 'Q-circuit-selectall' )	
	selectallEl.setAttribute( 'title', 'Select all' )
	selectallEl.setAttribute( 'moment-index', '0' )
	selectallEl.setAttribute( 'register-index', '0' )
	selectallEl.innerHTML = '&searr;'


	//  Add register index labels to left-hand column.
	
	for( let i = 0; i < circuit.bandwidth; i ++ ){

		const 
		registerIndex = i + 1,
		registerLabelEl = createDiv()
		
		foregroundEl.appendChild( registerLabelEl )
		registerLabelEl.classList.add( 'Q-circuit-header', 'Q-circuit-register-label' )
		registerLabelEl.setAttribute( 'title', 'Register '+ registerIndex )
		registerLabelEl.setAttribute( 'register-index', registerIndex )
		registerLabelEl.style.gridRowStart = Q.Circuit.Editor.registerIndexToGridRow( registerIndex )
		registerLabelEl.innerText = registerIndex
	}


	//  Add “Add register” button.
	
	const addRegisterEl = createDiv()
	foregroundEl.appendChild( addRegisterEl )
	addRegisterEl.classList.add( 'Q-circuit-header', 'Q-circuit-register-add' )
	addRegisterEl.setAttribute( 'title', 'Add register' )
	addRegisterEl.style.gridRowStart = Q.Circuit.Editor.registerIndexToGridRow( circuit.bandwidth + 1 )
	addRegisterEl.innerText = '+'


	//  Add moment index labels to top row.

	for( let i = 0; i < circuit.timewidth; i ++ ){

		const 
		momentIndex = i + 1,
		momentLabelEl = createDiv()

		foregroundEl.appendChild( momentLabelEl )
		momentLabelEl.classList.add( 'Q-circuit-header', 'Q-circuit-moment-label' )
		momentLabelEl.setAttribute( 'title', 'Moment '+ momentIndex )
		momentLabelEl.setAttribute( 'moment-index', momentIndex )
		momentLabelEl.style.gridColumnStart = Q.Circuit.Editor.momentIndexToGridColumn( momentIndex )
		momentLabelEl.innerText = momentIndex
	}


	//  Add “Add moment” button.
	
	const addMomentEl = createDiv()
	foregroundEl.appendChild( addMomentEl )
	addMomentEl.classList.add( 'Q-circuit-header', 'Q-circuit-moment-add' )
	addMomentEl.setAttribute( 'title', 'Add moment' )
	addMomentEl.style.gridColumnStart = Q.Circuit.Editor.momentIndexToGridColumn( circuit.timewidth + 1 )
	addMomentEl.innerText = '+'


	//  Add input values.

	circuit.qubits.forEach( function( qubit, i ){

		const 
		rowIndex = i + 1,
		inputEl = createDiv()
		
		inputEl.classList.add( 'Q-circuit-header', 'Q-circuit-input' )
		inputEl.setAttribute( 'title', `Qubit #${ rowIndex } starting value` )
		inputEl.setAttribute( 'register-index', rowIndex )
		inputEl.style.gridRowStart = Q.Circuit.Editor.registerIndexToGridRow( rowIndex )
		inputEl.innerText = qubit.beta.toText()
		foregroundEl.appendChild( inputEl )
	})


	//  Add operations.

	circuit.operations.forEach( function( operation ){

		Q.Circuit.Editor.set( circuitEl, operation )
	})


	//  Add event listeners.

	circuitEl.addEventListener( 'mousedown',  Q.Circuit.Editor.onPointerPress )
	circuitEl.addEventListener( 'touchstart', Q.Circuit.Editor.onPointerPress )
	window.addEventListener( 
	
		'qjs set$ completed', 
		 Q.Circuit.Editor.prototype.onExternalSet.bind( this )
	)
	window.addEventListener(

		'qjs clearThisInput$',
		Q.Circuit.Editor.prototype.onExternalClear.bind( this )
	)


	//  How can we interact with this circuit
	//  through code? (How cool is this?!)

	const referenceEl = document.createElement( 'p' )
	circuitEl.appendChild( referenceEl )
	referenceEl.innerHTML = `
		This circuit is accessible via your 
		<a href="index.html#Open_your_JavaScript_console" target="_blank">JavaScript console</a>
		as <code>$('#${ domId }').circuit</code>`


	//  Put a note in the JavaScript console
	//  that includes how to reference the circuit via code
	//  and an ASCII diagram for reference.

	Q.log( 0.5,
		
		`\n\nCreated a DOM interface for $('#${ domId }').circuit\n\n`,
		 circuit.toDiagram(),
		'\n\n\n'
	)
}


//  Augment Q.Circuit to have this functionality.

Q.Circuit.toDom = Q.Circuit.Editor
Q.Circuit.prototype.toDom = function( targetEl ){

	return new Q.Circuit.Editor( this, targetEl )
}








Object.assign( Q.Circuit.Editor, {

	index: 0,
	help: function(){ return Q.help( this )},
	dragEl: null,
	gridColumnToMomentIndex: function( gridColumn  ){ return +gridColumn - 2 },
	momentIndexToGridColumn: function( momentIndex ){ return momentIndex + 2 },
	gridRowToRegisterIndex:  function( gridRow ){ return +gridRow - 1 },
	registerIndexToGridRow:  function( registerIndex ){ return registerIndex + 1 },
	gridSize: 4,//  CSS: grid-auto-columns = grid-auto-rows = 4rem.
	pointToGrid: function( p ){

		
		//  Take a 1-dimensional point value
		// (so either an X or a Y but not both)
		//  and return what CSS grid cell contains it
		//  based on our 4rem × 4rem grid setup.
		
		const rem = parseFloat( getComputedStyle( document.documentElement ).fontSize )
		return 1 + Math.floor( p / ( rem * Q.Circuit.Editor.gridSize ))
	},
	gridToPoint: function( g ){


		//  Take a 1-dimensional grid cell value
		// (so either a row or a column but not both)
		//  and return the minimum point value it contains.

		const  rem = parseFloat( getComputedStyle( document.documentElement ).fontSize )
		return rem * Q.Circuit.Editor.gridSize * ( g - 1 )
	},
	getInteractionCoordinates: function( event, pageOrClient ){

		if( typeof pageOrClient !== 'string' ) pageOrClient = 'client'//page
		if( event.changedTouches && 
			event.changedTouches.length ) return {

			x: event.changedTouches[ 0 ][ pageOrClient +'X' ],
			y: event.changedTouches[ 0 ][ pageOrClient +'Y' ]
		}
		return {

			x: event[ pageOrClient +'X' ],
			y: event[ pageOrClient +'Y' ]
		}
	},
	createPalette: function( targetEl ){

		if( typeof targetEl === 'string' ) targetEl = document.getElementById( targetEl )	

		const 
		paletteEl = targetEl instanceof HTMLElement ? targetEl : document.createElement( 'div' ),
		randomRangeAndSign = function(  min, max ){

			const r = min + Math.random() * ( max - min )
			return Math.floor( Math.random() * 2 ) ? r : -r
		}

		paletteEl.classList.add( 'Q-circuit-palette' )

		'HXYZS'
		.split( '' )
		.forEach( function( label ){

			const gate = Q.Gate.findByLabel( label )

			const operationEl = document.createElement( 'div' )
			paletteEl.appendChild( operationEl )
			operationEl.classList.add( 'Q-circuit-operation' )
			operationEl.classList.add( 'Q-circuit-operation-'+ gate.css )
			operationEl.setAttribute( 'gate-label', label )

			const tileEl = document.createElement( 'div' )
			operationEl.appendChild( tileEl )
			tileEl.classList.add( 'Q-circuit-operation-tile' )
			tileEl.innerText = label

			;[ 'before', 'after' ].forEach( function( layer ){

				tileEl.style.setProperty( '--Q-'+ layer +'-rotation', randomRangeAndSign( 2, 8 ) +'deg' )
				tileEl.style.setProperty( '--Q-'+ layer +'-x', randomRangeAndSign( 1, 3 ) +'px' )
				tileEl.style.setProperty( '--Q-'+ layer +'-y', randomRangeAndSign( 1, 3 ) +'px' )
			})
		})

		paletteEl.addEventListener( 'mousedown',  Q.Circuit.Editor.onPointerPress )
		paletteEl.addEventListener( 'touchstart', Q.Circuit.Editor.onPointerPress )
		return paletteEl
	}
})






    /////////////////////////
   //                     //
  //   Operation CLEAR   //
 //                     //
/////////////////////////


Q.Circuit.Editor.prototype.onExternalClear = function( event ){

	if( event.detail.circuit === this.circuit ){

		Q.Circuit.Editor.clear( this.domElement, {

			momentIndex: event.detail.momentIndex,
			registerIndices: event.detail.registerIndices
		})
	}
}
Q.Circuit.Editor.clear = function( circuitEl, operation ){

	const momentIndex = operation.momentIndex
	operation.registerIndices.forEach( function( registerIndex ){

		Array
		.from( circuitEl.querySelectorAll(

			`[moment-index="${ momentIndex }"]`+
			`[register-index="${ registerIndex }"]`
		
		))
		.forEach( function( op ){

			op.parentNode.removeChild( op )
		})
	})
}






    ///////////////////////
   //                   //
  //   Operation SET   //
 //                   //
///////////////////////


Q.Circuit.Editor.prototype.onExternalSet = function( event ){

	if( event.detail.circuit === this.circuit ){

		Q.Circuit.Editor.set( this.domElement, {

			gate: event.detail.gate,
			momentIndex: event.detail.momentIndex,
			registerIndices: event.detail.registerIndices
		})
	}
}
Q.Circuit.Editor.set = function( circuitEl, operation ){

	const 
	backgroundEl = circuitEl.querySelector( '.Q-circuit-board-background' ),
	foregroundEl = circuitEl.querySelector( '.Q-circuit-board-foreground' )

	operation.registerIndices.forEach( function( registerIndex, i ){

		const operationEl = document.createElement( 'div' )
		foregroundEl.appendChild( operationEl )
		operationEl.classList.add( 'Q-circuit-operation', 'Q-circuit-operation-'+ operation.gate.css )
		operationEl.setAttribute( 'gate-label', operation.gate.label )
		operationEl.setAttribute( 'moment-index', operation.momentIndex )
		operationEl.setAttribute( 'register-index', registerIndex )
		operationEl.style.gridColumnStart = Q.Circuit.Editor.momentIndexToGridColumn( operation.momentIndex )
		operationEl.style.gridRowStart = Q.Circuit.Editor.registerIndexToGridRow( registerIndex )

		const tileEl = document.createElement( 'div' )
		operationEl.appendChild( tileEl )
		tileEl.classList.add( 'Q-circuit-operation-tile' )
		tileEl.setAttribute( 'title', operation.gate.name )
		tileEl.innerText = operation.gate.label


		//  Add operation link wires
		//  for multi-qubit operations.

		if( operation.registerIndices.length > 1 ){

			operation.registerIndices.forEach( function( registerIndex, i ){

				if( i < operation.registerIndices.length - 1 ){			

					const 
					siblingRegisterIndex = operation.registerIndices[ i + 1 ],
					registerDelta = Math.abs( siblingRegisterIndex - registerIndex ),
					start = Math.min( registerIndex, siblingRegisterIndex ),
					end   = Math.max( registerIndex, siblingRegisterIndex ),
					containerEl = document.createElement( 'div' ),
					linkEl = document.createElement( 'div' )

					backgroundEl.appendChild( containerEl )							
					containerEl.setAttribute( 'moment-index', operation.momentIndex )
					containerEl.setAttribute( 'register-index', registerIndex )
					containerEl.classList.add( 'Q-circuit-operation-link-container' )
					containerEl.style.gridRowStart = Q.Circuit.Editor.registerIndexToGridRow( start )
					containerEl.style.gridRowEnd   = Q.Circuit.Editor.registerIndexToGridRow( end + 1 )
					containerEl.style.gridColumn   = Q.Circuit.Editor.momentIndexToGridColumn( operation.momentIndex )

					containerEl.appendChild( linkEl )
					linkEl.classList.add( 'Q-circuit-operation-link' )
					if( registerDelta > 1 ) linkEl.classList.add( 'Q-circuit-operation-link-curved' )
				}
			})
			if( i === 0 ){

				operationEl.classList.add( 'Q-circuit-operation-control' )
				tileEl.setAttribute( 'title', 'Control' )
				tileEl.innerText = ''
			}
			else operationEl.classList.add( 'Q-circuit-operation-target' )
		}
	})
}






    //////////////////////
   //                  //
  //   Pointer MOVE   //
 //                  //
//////////////////////


Q.Circuit.Editor.onPointerMove = function( event ){


	//  We need our cursor coordinates straight away.
	//  We’ll use that both for dragging (immediately below)
	//  and for hover highlighting (further below).
	//  Let’s also hold on to a list of all DOM elements
	//  that contain this X, Y point
	//  and also see if one of those is a circuit board container.

	const 
	{ x, y } = Q.Circuit.Editor.getInteractionCoordinates( event ),
	foundEls = document.elementsFromPoint( x, y ),
	boardContainerEl = foundEls.find( function( el ){

		return el.classList.contains( 'Q-circuit-board-container' )
	})
	

	//  Are we in the middle of a circuit clipboard drag?
	//  If so we need to move that thing!

	if( Q.Circuit.Editor.dragEl !== null ){


		//  ex. Don’t scroll on touch devices!

		event.preventDefault()
		

		//  This was a very useful resource
		//  for a reality check on DOM coordinates:
		//  https://javascript.info/coordinates

		Q.Circuit.Editor.dragEl.style.left = ( x + window.pageXOffset + Q.Circuit.Editor.dragEl.offsetX ) +'px'
		Q.Circuit.Editor.dragEl.style.top  = ( y + window.pageYOffset + Q.Circuit.Editor.dragEl.offsetY ) +'px'

		if( !boardContainerEl ) Q.Circuit.Editor.dragEl.classList.add( 'Q-circuit-clipboard-destroy' )
		else Q.Circuit.Editor.dragEl.classList.remove( 'Q-circuit-clipboard-destroy' )
	}


	//  If we’re not over a circuit board container
	//  then there’s no highlighting work to do
	//  so let’s bail now.

	if( !boardContainerEl ) return


	//  Now we know we have a circuit board
	//  so we must have a circuit
	//  and if that’s locked then highlighting changes allowed!

	const circuitEl = boardContainerEl.closest( '.Q-circuit' )
	if( circuitEl.classList.contains( 'Q-circuit-locked' )) return


	//  Ok, we’ve found a circuit board.
	//  First, un-highlight everything.

	Array.from( boardContainerEl.querySelectorAll(`

		.Q-circuit-board-background > div, 
		.Q-circuit-board-foreground > div
	
	`)).forEach( function( el ){

		el.classList.remove( 'Q-circuit-cell-highlighted' )
	})


	//  Let’s prioritize any element that is “sticky”
	//  which means it can appear OVER another grid cell.

	const
	cellEl = foundEls.find( function( el ){

		const style = window.getComputedStyle( el )
		return (

			style.position === 'sticky' && ( 

				el.getAttribute( 'moment-index' ) !== null ||
				el.getAttribute( 'register-index' ) !== null
			)
		)
	}),
	highlightByQuery = function( query ){

		Array.from( boardContainerEl.querySelectorAll( query ))
		.forEach( function( el ){

			el.classList.add( 'Q-circuit-cell-highlighted' )
		})
	}


	//  If we’ve found one of these “sticky” cells
	//  let’s use its moment and/or register data
	//  to highlight moments or registers (or all).

	if( cellEl ){

		const 
		momentIndex   = cellEl.getAttribute( 'moment-index' ),
		registerIndex = cellEl.getAttribute( 'register-index' )
		
		if( momentIndex === null ){
			
			highlightByQuery( `div[register-index="${ registerIndex }"]` )
			return
		}
		if( registerIndex === null ){

			highlightByQuery( `div[moment-index="${ momentIndex }"]` )
			return
		}
		highlightByQuery(`

			.Q-circuit-board-background > div[moment-index],
			.Q-circuit-board-foreground > .Q-circuit-operation

		`)
		return
	}


	//  Ok, we know we’re hovering over the circuit board
	//  but we’re not on a “sticky” cell.
	//  We might be over an operation, but we might not.
	//  No matter -- we’ll infer the moment and register indices
	//  from the cursor position.

	const
	boardElBounds = boardContainerEl.getBoundingClientRect(),
	xLocal        = x - boardElBounds.left + boardContainerEl.scrollLeft + 1,
	yLocal        = y - boardElBounds.top  + boardContainerEl.scrollTop + 1,
	columnIndex   = Q.Circuit.Editor.pointToGrid( xLocal ),
	rowIndex      = Q.Circuit.Editor.pointToGrid( yLocal ),
	momentIndex   = Q.Circuit.Editor.gridColumnToMomentIndex( columnIndex ),
	registerIndex = Q.Circuit.Editor.gridRowToRegisterIndex( rowIndex )


	//  If this hover is “out of bounds”
	//  ie. on the same row or column as an “Add register” or “Add moment” button
	//  then let’s not highlight anything.

	if( momentIndex > circuitEl.circuit.timewidth ||
		registerIndex > circuitEl.circuit.bandwidth ) return
	

	//  If we’re at 0, 0 or below that either means
	//  we’re over the “Select all” button (already taken care of above)
	//  or over the lock toggle button.
	//  Either way, it’s time to bail.

	if( momentIndex < 1 || registerIndex < 1 ) return


	//  If we’ve made it this far that means 
	//  we have valid moment and register indices.
	//  Highlight them!

	highlightByQuery(`

		div[moment-index="${ momentIndex }"],
		div[register-index="${ registerIndex }"]
	`)
	return
}






    //////////////////////
   //                  //
  //   Pointer EXIT   //
 //                  //
//////////////////////


Q.Circuit.Editor.onPointerExit = function( event ){

	const circuitEl = event.target.closest( '.Q-circuit' )
	Array.from( circuitEl.querySelectorAll( '.Q-circuit-board-background > div, .Q-circuit-board-foreground > div' ))
	.forEach( function( el ){

		el.classList.remove( 'Q-circuit-cell-highlighted' )
	})
}






    ///////////////////////
   //                   //
  //   Pointer PRESS   //
 //                   //
///////////////////////


Q.Circuit.Editor.onPointerPress = function( event ){


	//  This is just a safety net
	//  in case something terrible has ocurred.
	// (ex. Did the user click and then their mouse ran
	//  outside the window but browser didn’t catch it?)

	if( Q.Circuit.Editor.dragEl !== null ){

		Q.Circuit.Editor.onPressEnded( event )
		return
	}


	const 
	targetEl  = event.target,
	circuitEl = targetEl.closest( '.Q-circuit' ),
	paletteEl = targetEl.closest( '.Q-circuit-palette' )


	//  If we can’t find a circuit that’s a really bad sign
	//  considering this event should be fired when a circuit
	//  is clicked on. So... bail!

	if( !circuitEl && !paletteEl ) return


	//  This is a bit of a gamble.
	//  There’s a possibility we’re not going to drag anything,
	//  but we’ll prep these variables here anyway
	//  because both branches of if( circuitEl ) and if( paletteEl )
	//  below will have access to this scope.
	
	dragEl = document.createElement( 'div' )
	dragEl.classList.add( 'Q-circuit-clipboard' )
	const { x, y } = Q.Circuit.Editor.getInteractionCoordinates( event )


	//  Are we dealing with a circuit interface?
	//  ie. NOT a palette interface.

	if( circuitEl ){
	

		//  Shall we toggle the circuit lock?

		const
		circuitIsLocked = circuitEl.classList.contains( 'Q-circuit-locked' ),
		lockEl = targetEl.closest( '.Q-circuit-toggle-lock' )
		
		if( lockEl ){

			if( circuitIsLocked ){

				circuitEl.classList.remove( 'Q-circuit-locked' )
				lockEl.innerText = '🔓'
			}
			else {

				circuitEl.classList.add( 'Q-circuit-locked' )
				lockEl.innerText = '🔒'
			}


			//  We’ve toggled the circuit lock button
			//  so we should prevent further propagation
			//  before proceeding further.
			//  That includes running all this code again
			//  if it was originally fired by a mouse event
			//  and about to be fired by a touch event!

			event.preventDefault()
			event.stopPropagation()
			return
		}


		//  If our circuit is already “locked”
		//  then there’s nothing more to do here.
		
		if( circuitIsLocked ) {

			Q.log( 0.5, `User attempted to interact with a circuit editor but it was locked.` )
			return
		}


		const
		undoEl = targetEl.closest( '.Q-circuit-button-undo' ),
		redoEl = targetEl.closest( '.Q-circuit-button-redo' ),
		addMomentEl   = targetEl.closest( '.Q-circuit-moment-add' ),
		addRegisterEl = targetEl.closest( '.Q-circuit-register-add' ),
		cellEl = targetEl.closest(`

			.Q-circuit-board-foreground > div,
			.Q-circuit-palette > div
		`)

		if( !cellEl &&
			!undoEl &&
			!redoEl &&
			!addMomentEl &&
			!addRegisterEl ) return


		//  By this point we know that the circuit is unlocked
		//  and that we’ll activate a button / drag event / etc.
		//  So we need to hault futher event propagation
		//  including running this exact code again if this was
		//  fired by a touch event and about to again by mouse.
		//  This may SEEM redundant because we did this above
		//  within the lock-toggle button code
		//  but we needed to NOT stop propagation if the circuit
		//  was already locked -- for scrolling and such.

		event.preventDefault()
		event.stopPropagation()


		//  +++++++++++++
		//  Come back and add fuctionality here 
		//  for undo, redo, add !

		if( undoEl ) console.log( '→ Undo' )
		if( redoEl ) console.log( '→ Redo' )
		if( addMomentEl   ) console.log( '→ Add moment' )
		if( addRegisterEl ) console.log( '→ Add register' )


		//  We’re done dealing with external buttons.
		//  So if we can’t find a circuit CELL
		//  then there’s nothing more to do here.

		if( !cellEl ) return


		//  Once we know what cell we’ve pressed on
		//  we can get the momentIndex and registerIndex
		//  from its pre-defined attributes.
		//  NOTE that we are getting CSS grid column and row
		//  from our own conversion function and NOT from
		//  asking its styles. Why? Because browsers convert
		//  grid commands to a shorthand less easily parsable
		//  and therefore makes our code and reasoning 
		//  more prone to quirks / errors. Trust me!

		const
		momentIndex   = +cellEl.getAttribute( 'moment-index' ),
		registerIndex = +cellEl.getAttribute( 'register-index' ),
		columnIndex   = Q.Circuit.Editor.momentIndexToGridColumn( momentIndex ),
		rowIndex      = Q.Circuit.Editor.registerIndexToGridRow( registerIndex )


		//  Looks like our circuit is NOT locked
		//  and we have a valid circuit CELL
		//  so let’s find everything else we could need.

		const
		selectallEl     = targetEl.closest( '.Q-circuit-selectall' ),
		registerLabelEl = targetEl.closest( '.Q-circuit-register-label' ),
		momentLabelEl   = targetEl.closest( '.Q-circuit-moment-label' ),
		inputEl         = targetEl.closest( '.Q-circuit-input' ),
		operationEl     = targetEl.closest( '.Q-circuit-operation' )
		

		//  +++++++++++++++
		//  We’ll have to add some input editing capability later...
		//  Of course you can already do this in code!
		//  For now though most quantum code assumes all qubits
		//  begin with a value of zero so this is mostly ok ;)

		if( inputEl ){

			console.log( '→ Edit input Qubit value at', registerIndex )
			return
		}


		//  Let’s inspect a group of items via a CSS query.
		//  If any of them are NOT “selected” (highlighted)
		//  then select them all.
		//  But if ALL of them are already selected
		//  then UNSELECT them all.

		function toggleSelection( query ){

			const 
			operations = Array.from( circuitEl.querySelectorAll( query )),
			operationsSelectedLength = operations.reduce( function( sum, element ){

				sum += +element.classList.contains( 'Q-circuit-cell-selected' )
				return sum
			
			}, 0 )

			if( operationsSelectedLength === operations.length ){

				operations.forEach( function( el ){

					el.classList.remove( 'Q-circuit-cell-selected' )
				})
			}
			else {

				operations.forEach( function( el ){

					el.classList.add( 'Q-circuit-cell-selected' )
				})
			}
		}


		//  Clicking on the “selectAll” button
		//  or any of the Moment labels / Register labels
		//  causes a selection toggle.
		//  In the future we may want to add
		//  dragging of entire Moment columns / Register rows
		//  to splice them out / insert them elsewhere
		//  when a user clicks and drags them.

		if( selectallEl ){

			toggleSelection( '.Q-circuit-operation' )
			return
		}
		if( momentLabelEl ){

			toggleSelection( `.Q-circuit-operation[moment-index="${ momentIndex }"]` )
			return
		}
		if( registerLabelEl ){

			toggleSelection( `.Q-circuit-operation[register-index="${ registerIndex }"]` )
			return
		}


		//  Right here we can made a big decision:
		//  If you’re not pressing on an operation
		//  then GO HOME.

		if( !operationEl ) return


		//  Ok now we know we are dealing with an operation.
		//  This preserved selection state information
		//  will be useful for when onPointerRelease is fired.

		if( operationEl.classList.contains( 'Q-circuit-cell-selected' )){

			operationEl.wasSelected = true
		}
		else operationEl.wasSelected = false


		//  And now we can proceed knowing that 
		//  we need to select this operation
		//  and possibly drag it
		//  as well as any other selected operations.

		operationEl.classList.add( 'Q-circuit-cell-selected' )
		const selectedOperations = Array.from( circuitEl.querySelectorAll( '.Q-circuit-cell-selected' ))		
		dragEl.circuitEl = circuitEl
		dragEl.originEl  = circuitEl.querySelector( '.Q-circuit-board-foreground' )

	
		//  These are the default values; 
		//  will be used if we’re only dragging one operation around.
		//  But if dragging more than one operation
		//  and we’re dragging the clipboard by an operation
		//  that is NOT in the upper-left corner of the clipboard
		//  then we need to know what the offset is.
		// (Will be calculated below.)
		
		dragEl.columnIndexOffset = 1
		dragEl.rowIndexOffset = 1


		//  Now collect all of the selected operations,
		//  rip them from the circuit board’s foreground layer
		//  and place them on the clipboard.
		
		let
		columnIndexMin = Infinity,
		rowIndexMin = Infinity

		selectedOperations.forEach( function( el ){


			//  WORTH REPEATING:
			//  Once we know what cell we’ve pressed on
			//  we can get the momentIndex and registerIndex
			//  from its pre-defined attributes.
			//  NOTE that we are getting CSS grid column and row
			//  from our own conversion function and NOT from
			//  asking its styles. Why? Because browsers convert
			//  grid commands to a shorthand less easily parsable
			//  and therefore makes our code and reasoning 
			//  more prone to quirks / errors. Trust me!

			const
			momentIndex   = +el.getAttribute( 'moment-index' ),
			registerIndex = +el.getAttribute( 'register-index' ),
			columnIndex   = Q.Circuit.Editor.momentIndexToGridColumn( momentIndex ),
			rowIndex      = Q.Circuit.Editor.registerIndexToGridRow( registerIndex )

			columnIndexMin = Math.min( columnIndexMin, columnIndex )
			rowIndexMin = Math.min( rowIndexMin, rowIndex )
			el.classList.remove( 'Q-circuit-cell-selected' )
			el.origin = { momentIndex, registerIndex, columnIndex, rowIndex }
			dragEl.appendChild( el )
		})
		selectedOperations.forEach( function( el ){

			const 
			columnIndexForClipboard = 1 + el.origin.columnIndex - columnIndexMin,
			rowIndexForClipboard    = 1 + el.origin.rowIndex - rowIndexMin
			
			el.style.gridColumn = columnIndexForClipboard
			el.style.gridRow = rowIndexForClipboard


			//  If this operation element is the one we grabbed
			// (mostly relevant if we’re moving multiple operations at once)
			//  we need to know what the “offset” so everything can be
			//  placed correctly relative to this drag-and-dropped item.

			if( el.origin.columnIndex === columnIndex &&
				el.origin.rowIndex === rowIndex ){

				dragEl.columnIndexOffset = columnIndexForClipboard
				dragEl.rowIndexOffset = rowIndexForClipboard
			}
		})
	

		//  We need an XY offset that describes the difference
		//  between the mouse / finger press position
		//  and the clipboard’s intended upper-left position.
		//  To do that we need to know the press position (obviously!),
		//  the upper-left bounds of the circuit board’s foreground,
		//  and the intended upper-left bound of clipboard.

		const
		boardEl = circuitEl.querySelector( '.Q-circuit-board-foreground' ),
		bounds   = boardEl.getBoundingClientRect(),
		minX     = Q.Circuit.Editor.gridToPoint( columnIndexMin ),
		minY     = Q.Circuit.Editor.gridToPoint( rowIndexMin )		
		
		dragEl.offsetX = bounds.left + minX - x
		dragEl.offsetY = bounds.top  + minY - y
		dragEl.momentIndex = momentIndex
		dragEl.registerIndex = registerIndex
	}
	else if( paletteEl ){

		const 
		operationEl = targetEl.closest( '.Q-circuit-operation' ),
		bounds      = operationEl.getBoundingClientRect(),
		{ x, y }    = Q.Circuit.Editor.getInteractionCoordinates( event )

		dragEl.appendChild( operationEl.cloneNode( true ))
		dragEl.originEl = paletteEl
		dragEl.offsetX  = bounds.left - x
		dragEl.offsetY  = bounds.top  - y
	}
	dragEl.timestamp = Date.now()


	//  Append the clipboard to the document,
	//  establish a global reference to it,
	//  and trigger a draw of it in the correct spot.
	
	document.body.appendChild( dragEl )
	Q.Circuit.Editor.dragEl = dragEl
	Q.Circuit.Editor.onPointerMove( event )
}






    /////////////////////////
   //                     //
  //   Pointer RELEASE   //
 //                     //
/////////////////////////


Q.Circuit.Editor.onPointerRelease = function( event ){


	//  If there’s no dragEl then bail immediately.

	if( Q.Circuit.Editor.dragEl === null ) return
	

	//  Looks like we’re moving forward with this plan,
	//  so we’ll take control of the input now.

	event.preventDefault()
	event.stopPropagation()


	//  We can’t get the drop target from the event.
	//  Think about it: What was under the mouse / finger
	//  when this drop event was fired? THE CLIPBOARD !
	//  So instead we need to peek at what elements are
	//  under the mouse / finger, skipping element [0]
	//  because that will be the clipboard.

	const
	{ x, y } = Q.Circuit.Editor.getInteractionCoordinates( event ),
	boardContainerEl = document.elementsFromPoint( x, y )
	.find( function( el ){

		return el.classList.contains( 'Q-circuit-board-container' )
	}),
	returnToOrigin = function(){


		//  We can only do a “true” return to origin
		//  if we were dragging from a circuit.
		//  If we were dragging from a palette
		//  we can just stop dragging.

		if( Q.Circuit.Editor.dragEl.circuitEl ){
		
			Array.from( Q.Circuit.Editor.dragEl.children ).forEach( function( el ){

				Q.Circuit.Editor.dragEl.originEl.appendChild( el )
				el.style.gridColumn = el.origin.columnIndex
				el.style.gridRow    = el.origin.rowIndex
				if( el.wasSelected === true ) el.classList.remove( 'Q-circuit-cell-selected' )
				else el.classList.add( 'Q-circuit-cell-selected' )
			})
		}
		document.body.removeChild( Q.Circuit.Editor.dragEl )
		Q.Circuit.Editor.dragEl = null
	}


	//  If we have not dragged on to a circuit board
	//  then we’re throwing away this operation.

	if( !boardContainerEl ){
	
		if( Q.Circuit.Editor.dragEl.circuitEl ){

			const originCircuit = Q.Circuit.Editor.dragEl.circuitEl.circuit
			
			Array
			.from( Q.Circuit.Editor.dragEl.children )
			.forEach( function( child ){

				originCircuit.clearThisInput$(

					child.origin.momentIndex,			
					child.origin.registerIndex
				)
			})
			window.dispatchEvent( new CustomEvent( 

				'qjs gui altered circuit', 
				{ detail: { circuit: originCircuit }}
			))
			// originCircuit.evaluate$()
			//  ++++++++++++
			//  need to trigger a new eval?
			// console.log( originCircuit.report$() )
		}

		//+++++++++
		//  We should do a puff of smoke animation here
		//  like removing shit from Apple’s macOS dock!

		document.body.removeChild( Q.Circuit.Editor.dragEl )
		Q.Circuit.Editor.dragEl = null
		return
	}


	//  If we couldn’t determine a circuitEl
	//  from the drop target,
	//  or if there is a target circuit but it’s locked,
	//  then we need to return these dragged items
	//  to their original circuit.

	const circuitEl = boardContainerEl.closest( '.Q-circuit' )
	if( circuitEl.classList.contains( 'Q-circuit-locked' )){

		returnToOrigin()
		return
	}


	//  Time to get serious.
	//  Where exactly are we dropping on to this circuit??

	const 
	circuit     = circuitEl.circuit,
	bounds      = boardContainerEl.getBoundingClientRect(),
	xAdjusted   = x - bounds.left + boardContainerEl.scrollLeft,
	yAdjusted   = y - bounds.top  + boardContainerEl.scrollTop,
	momentIndex = Q.Circuit.Editor.gridColumnToMomentIndex( 

		Q.Circuit.Editor.pointToGrid( xAdjusted )
	),
	registerIndex = Q.Circuit.Editor.gridRowToRegisterIndex(

		Q.Circuit.Editor.pointToGrid( yAdjusted )
	),
	foregroundEl = circuitEl.querySelector( '.Q-circuit-board-foreground' )


	//  If this is a self-drop
	//  we can also just return to origin and bail.

	if( Q.Circuit.Editor.dragEl.circuitEl === circuitEl &&
		Q.Circuit.Editor.dragEl.momentIndex === momentIndex &&
		Q.Circuit.Editor.dragEl.registerIndex === registerIndex ){

		returnToOrigin()
		return
	}


	//  Is this a valid drop target within this circuit?

	if(
		momentIndex   < 1 || 
		momentIndex   > circuit.timewidth ||
		registerIndex < 1 ||
		registerIndex > circuit.bandwidth
	){

		returnToOrigin()
		return
	}
	

	//  Finally! Work is about to be done!
	//  All we need to do is tell the circuit itself
	//  where we need to place these dragged items.
	//  It will do all the validation for us
	//  and then fire events that will place new elements
	//  where they need to go!

	const draggedOperations = Array.from( Q.Circuit.Editor.dragEl.children )


	//  Whether we’ve ripped operations from THIS circuit
	//  or from another circuit
	//  we had better send “clear” commands for those positions
	//  BEFORE we try “setting” anything new down!

	if( Q.Circuit.Editor.dragEl.circuitEl ){

		const originCircuit = Q.Circuit.Editor.dragEl.circuitEl.circuit
		draggedOperations.forEach( function( child ){

			originCircuit.clearThisInput$(

				child.origin.momentIndex,			
				child.origin.registerIndex
			)
		})
	}


	//  Now we can safely send new operations to circuit.set().

	draggedOperations.forEach( function( child ){

		let
		momentIndexTarget   = momentIndex, 
		registerIndexTarget = registerIndex
		
		if( Q.Circuit.Editor.dragEl.circuitEl ){

			momentIndexTarget   += child.origin.momentIndex   - Q.Circuit.Editor.dragEl.momentIndex
			registerIndexTarget += child.origin.registerIndex - Q.Circuit.Editor.dragEl.registerIndex
		}
		circuit.set$( 

			momentIndexTarget,
			child.getAttribute( 'gate-label' ), 
			[ registerIndexTarget ]
		)
	})
	


	//  +++++++++++++++++++++++++++++++++++++
	// console.log( circuit.toDiagram() )
	// console.log( circuit.report$() )
	//  +++++++++++++++++++++++++++++++++++++
	// circuit.evaluate$()
	window.dispatchEvent( new CustomEvent( 

		'qjs gui altered circuit', 
		{ detail: { circuit }}
	))






	//  If the original circuit and destination circuit
	//  are not the same thing
	//  then we need to also eval the original circuit.

	if( Q.Circuit.Editor.dragEl.circuitEl &&
		Q.Circuit.Editor.dragEl.circuitEl !== circuitEl ){

		const originCircuit = Q.Circuit.Editor.dragEl.circuitEl.circuit

		//  ++++++++++++++++++++++++++++++++++++++++++
		// console.log( 'ALSO - trigger an eval on the original circuit.' )
		// console.log( originCircuit.toDiagram() )
		// console.log( originCircuit.report$() )
		//  ++++++++++++++++++++++++++++++++++++++++++
		// originCircuit.evaluate$()

		window.dispatchEvent( new CustomEvent( 

			'qjs gui altered circuit', 
			{ detail: { circuit: originCircuit }}
		))
	}


	//  We’re finally done here.
	//  Clean up and go home.
	//  It’s been a long journey.
	//  I love you all.

	document.body.removeChild( Q.Circuit.Editor.dragEl )
	Q.Circuit.Editor.dragEl = null
}






    ///////////////////
   //               //
  //   Listeners   //
 //               //
///////////////////


window.addEventListener( 'DOMContentLoaded', function( event ){


	//  These listeners must be applied
	//  to the entire WINDOW (and not just document.body!)

	window.addEventListener( 'mousemove',  Q.Circuit.Editor.onPointerMove )
	window.addEventListener( 'touchmove',  Q.Circuit.Editor.onPointerMove )
	window.addEventListener( 'mouseup',    Q.Circuit.Editor.onPointerRelease )
	window.addEventListener( 'touchend',   Q.Circuit.Editor.onPointerRelease )
})






