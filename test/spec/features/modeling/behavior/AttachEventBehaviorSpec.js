/* global sinon */

import {
  bootstrapModeler,
  inject
} from 'test/TestHelper';

import modelingModule from 'lib/features/modeling';
import coreModule from 'lib/core';


describe('features/modeling/behavior - attach events', function() {

  var testModules = [ coreModule, modelingModule ];

  var processDiagramXML = require('test/spec/features/rules/BpmnRules.attaching.bpmn');

  beforeEach(bootstrapModeler(processDiagramXML, { modules: testModules }));


  describe('basics', function() {

    it('should execute on attach', inject(function(elementRegistry, modeling) {

      // given
      var eventId = 'IntermediateThrowEvent',
          intermediateThrowEvent = elementRegistry.get(eventId),
          subProcess = elementRegistry.get('SubProcess_1'),
          boundaryEvent;

      var elements = [ intermediateThrowEvent ];

      // when
      modeling.moveElements(elements, { x: 0, y: -90 }, subProcess, { attach: true });

      // then
      boundaryEvent = elementRegistry.get(eventId);

      expect(intermediateThrowEvent.parent).to.not.exist;
      expect(boundaryEvent).to.exist;
      expect(boundaryEvent.type).to.equal('bpmn:BoundaryEvent');
      expect(boundaryEvent.businessObject.attachedToRef).to.equal(subProcess.businessObject);
    }));


    it('should NOT execute on drop', inject(function(elementRegistry, modeling) {

      // given
      var eventId = 'IntermediateThrowEvent',
          intermediateThrowEvent = elementRegistry.get(eventId),
          subProcess = elementRegistry.get('SubProcess_1');

      var elements = [ intermediateThrowEvent ];

      // when
      modeling.moveElements(elements, { x: 0, y: -150 }, subProcess);

      // then
      expect(intermediateThrowEvent.parent).to.eql(subProcess);
      expect(intermediateThrowEvent.type).to.equal('bpmn:IntermediateThrowEvent');
    }));
  });


  describe('event definition', function() {

    it('should copy event definitions', inject(function(elementRegistry, modeling) {

      // given
      var attachableEvents = [
        'IntermediateThrowEvent',
        'MessageCatchEvent',
        'TimerCatchEvent',
        'SignalCatchEvent',
        'ConditionalCatchEvent'
      ];

      attachableEvents.forEach(function(eventId) {

        var event = elementRegistry.get(eventId),
            subProcess = elementRegistry.get('SubProcess_1'),
            eventDefinitions = event.businessObject.eventDefinitions,
            boundaryEvent, bo;

        var elements = [ event ];

        // when
        modeling.moveElements(elements, { x: 0, y: -90 }, subProcess, { attach: true });

        // then
        boundaryEvent = elementRegistry.get(eventId);
        bo = boundaryEvent.businessObject;

        expect(boundaryEvent.type).to.equal('bpmn:BoundaryEvent');
        expect(bo.eventDefinitions).to.jsonEqual(eventDefinitions, skipId);
      });
    }));
  });


  describe('connections', function() {

    var eventId = 'IntermediateThrowEventWithConnections';

    it('should remove incoming connection', inject(function(elementRegistry, modeling) {

      // given
      var event = elementRegistry.get(eventId),
          subProcess = elementRegistry.get('SubProcess_1'),
          gateway = elementRegistry.get('Gateway_1'),
          boundaryEvent;

      var elements = [ event ];

      // when
      modeling.moveElements(elements, { x: 0, y: -90 }, subProcess, { attach: true });

      // then
      boundaryEvent = elementRegistry.get(eventId);

      expect(boundaryEvent.incoming).to.have.lengthOf(0);
      expect(gateway.outgoing).to.have.lengthOf(0);
    }));


    it('should keep outgoing connection', inject(function(elementRegistry, modeling) {

      // given
      var event = elementRegistry.get(eventId),
          subProcess = elementRegistry.get('SubProcess_1'),
          task = elementRegistry.get('Task_1'),
          boundaryEvent;

      var elements = [ event ];

      // when
      modeling.moveElements(elements, { x: 0, y: -90 }, subProcess, { attach: true });

      // then
      boundaryEvent = elementRegistry.get(eventId);

      expect(boundaryEvent.outgoing).to.have.lengthOf(1);
      expect(task.incoming).to.have.lengthOf(1);
    }));


    it('should lay out connection once', inject(function(eventBus, elementRegistry, modeling) {

      // given
      var layoutSpy = sinon.spy(),
          event = elementRegistry.get(eventId),
          subProcess = elementRegistry.get('SubProcess_1');

      eventBus.on('commandStack.connection.layout.execute', layoutSpy);

      var elements = [ event ];

      // when
      modeling.moveElements(elements, { x: 0, y: -90 }, subProcess, { attach: true });

      // then
      expect(layoutSpy).to.be.calledOnce;
    }));
  });

});



// helper //////
function skipId(key, value) {

  if (key === 'id') {
    return;
  }

  return value;
}
