"use client";
import React, { useState } from 'react';
import { Download, Trash2, Undo, Play, Users } from 'lucide-react';

const VolleyballMatchEncoder = () => {
  const [step, setStep] = useState('setup');
  const [matchConfig, setMatchConfig] = useState({
    homeTeam: '',
    awayTeam: '',
    homePlayers: Array(6).fill(''),
    awayPlayers: Array(6).fill(''),
    homeSetterPosition: '1',
    awaySetterPosition: '1',
    serviceTeam: 'home'
  });
  
  const [matchCode, setMatchCode] = useState('');
  const [currentAction, setCurrentAction] = useState('service');
  const [history, setHistory] = useState([]);
  const [pointInProgress, setPointInProgress] = useState(true);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [setsWon, setSetsWon] = useState({ home: 0, away: 0 });
  const [showHelp, setShowHelp] = useState(false);
  const [isOpponentSide, setIsOpponentSide] = useState(false);
  const [showPointPicker, setShowPointPicker] = useState(false);
  
  const [formData, setFormData] = useState({
    playerNumber: '',
    serviceType: '',
    serviceZone: '',
    receptionQuality: '',
    passType: '',
    passQuality: '',
    blockType: '',
    attackType: '',
    attackDirection: '',
    attackResult: '',
    blockResult: '',
    relanceQuality: '',
    defenseQuality: ''
  });

  const resetForm = () => {
    setFormData({
      playerNumber: '',
      serviceType: '',
      serviceZone: '',
      receptionQuality: '',
      passType: '',
      passQuality: '',
      blockType: '',
      attackType: '',
      attackDirection: '',
      attackResult: '',
      blockResult: '',
      relanceQuality: '',
      defenseQuality: ''
    });
  };

  const startMatch = () => {
    if (!matchConfig.homeTeam || !matchConfig.awayTeam) {
      alert('Veuillez renseigner les noms des équipes');
      return;
    }
    
    const orderFromSetter = (players, setterPosition) => {
      const indexStart = Math.max(0, parseInt(setterPosition, 10) - 1);
      const rotated = [];
      for (let i = 0; i < 6; i++) {
        rotated.push(players[(indexStart + i) % 6]);
      }
      return rotated;
    };

    const homeOrdered = orderFromSetter(matchConfig.homePlayers, matchConfig.homeSetterPosition);
    const awayOrdered = orderFromSetter(matchConfig.awayPlayers, matchConfig.awaySetterPosition);

    let header = 'Match\n';
    header += `Set${currentSet}\n`;
    header += `SERVICE_${matchConfig.serviceTeam === 'home' ? 'DOM' : 'EXT'}\n`;
    header += `DOM_P${matchConfig.homeSetterPosition}_${homeOrdered.filter(p => p).join('-')}\n`;
    header += `EXT_P${matchConfig.awaySetterPosition}_${awayOrdered.filter(p => p).join('-')}\n`;
    header += '######\n';
    
    pushSnapshot();
    setMatchCode(header);
    setStep('match');
  };

  const pushSnapshot = () => {
    setHistory((prev) => [
      ...prev,
      { matchCode, currentAction, pointInProgress }
    ]);
  };

  const addToCode = (code) => {
    pushSnapshot();
    setMatchCode(matchCode + code);
    resetForm();
  };

  const undo = () => {
    if (history.length > 0) {
      const previousState = history[history.length - 1];
      setHistory(history.slice(0, -1));
      if (typeof previousState === 'string') {
        setMatchCode(previousState);
      } else if (previousState && typeof previousState === 'object') {
        setMatchCode(previousState.matchCode ?? matchCode);
        setCurrentAction(previousState.currentAction ?? currentAction);
        setPointInProgress(previousState.pointInProgress ?? pointInProgress);
      }
    }
  };

  const endPoint = (winner) => {
    const endCode = winner === 'home' ? '##' : '#';
    pushSnapshot();
    setMatchCode(matchCode + endCode + '\n');
    setCurrentAction('service');
    setPointInProgress(true);
    resetForm();
    
    if (winner === 'home') {
      const newScore = homeScore + 1;
      setHomeScore(newScore);
      if (newScore >= 25 && newScore - awayScore >= 2) {
        endSet('home');
      }
    } else {
      const newScore = awayScore + 1;
      setAwayScore(newScore);
      if (newScore >= 25 && newScore - homeScore >= 2) {
        endSet('away');
      }
    }
  };

  const endSet = (winner) => {
    const finalScore = `${homeScore}/${awayScore}\n\n`;
    setMatchCode(matchCode + finalScore);
    
    if (winner === 'home') {
      setSetsWon({...setsWon, home: setsWon.home + 1});
    } else {
      setSetsWon({...setsWon, away: setsWon.away + 1});
    }
    
    if (setsWon.home + 1 >= 3 || setsWon.away + 1 >= 3) {
      alert(`Match terminé ! ${winner === 'home' ? matchConfig.homeTeam : matchConfig.awayTeam} gagne !`);
      setStep('finished');
    } else {
      const nextSet = currentSet + 1;
      setCurrentSet(nextSet);
      setHomeScore(0);
      setAwayScore(0);
      
      const orderFromSetter = (players, setterPosition) => {
        const indexStart = Math.max(0, parseInt(setterPosition, 10) - 1);
        const rotated = [];
        for (let i = 0; i < 6; i++) {
          rotated.push(players[(indexStart + i) % 6]);
        }
        return rotated;
      };

      const homeOrdered = orderFromSetter(matchConfig.homePlayers, matchConfig.homeSetterPosition);
      const awayOrdered = orderFromSetter(matchConfig.awayPlayers, matchConfig.awaySetterPosition);

      let header = `Set${nextSet}\n`;
      header += `SERVICE_${matchConfig.serviceTeam === 'home' ? 'DOM' : 'EXT'}\n`;
      header += `DOM_P${matchConfig.homeSetterPosition}_${homeOrdered.filter(p => p).join('-')}\n`;
      header += `EXT_P${matchConfig.awaySetterPosition}_${awayOrdered.filter(p => p).join('-')}\n`;
      header += '######\n';
      
      pushSnapshot();
      setMatchCode(matchCode + header);
    }
  };

  const addTimeout = (team) => {
    const timeoutCode = `TM_${team === 'home' ? 'DOM' : 'EXT'}\n`;
    pushSnapshot();
    setMatchCode(matchCode + timeoutCode);
  };

  const addNetPass = () => {
    pushSnapshot();
    setMatchCode(matchCode + '//');
    resetForm();
  };

  const handleService = () => {
    const { playerNumber, serviceType, serviceZone } = formData;
    const player = isOpponentSide ? 'XX' : playerNumber;
    if ((!isOpponentSide && !player) || !serviceType || !serviceZone) {
      alert('Veuillez remplir tous les champs du service');
      return;
    }
    const code = `S${player.padStart(2, '0')}${serviceType}${serviceZone}`;
    addToCode(code);
    
    if (serviceZone === 'O' || serviceZone === 'F') {
      setCurrentAction('endPoint');
      setPointInProgress(false);
    } else {
      setCurrentAction('afterNet');
    }
  };

  const handleReception = () => {
    const { playerNumber, receptionQuality } = formData;
    const player = isOpponentSide ? 'XX' : playerNumber;
    if ((!isOpponentSide && !player) || !receptionQuality) {
      alert('Veuillez remplir tous les champs de la réception');
      return;
    }
    const code = `R${player.padStart(2, '0')}${receptionQuality}`;
    addToCode(code);
    
    if (receptionQuality === '-') {
      setCurrentAction('endPoint');
      setPointInProgress(false);
    } else {
      setCurrentAction('afterReception');
    }
  };

  const handlePass = () => {
    const { playerNumber, passType, passQuality, blockType } = formData;
    const player = isOpponentSide ? 'XX' : playerNumber;
    if ((!isOpponentSide && !player) || !passType || !passQuality || !blockType) {
      alert('Veuillez remplir tous les champs de la passe');
      return;
    }
    const code = `P${player.padStart(2, '0')}${passType}${passQuality}${blockType}`;
    addToCode(code);
    
    if (passQuality === '-') {
      setCurrentAction('endPoint');
      setPointInProgress(false);
    } else {
      setCurrentAction('attack');
    }
  };

  const handleAttack = () => {
    const { playerNumber, attackType, attackDirection, attackResult } = formData;
    const player = isOpponentSide ? 'XX' : playerNumber;
    if ((!isOpponentSide && !player) || !attackType || !attackDirection || !attackResult) {
      alert('Veuillez remplir tous les champs de l\'attaque');
      return;
    }
    const code = `A${player.padStart(2, '0')}${attackType}${attackDirection}${attackResult}`;
    addToCode(code);
    
    if (attackResult === 'P') {
      setCurrentAction('endPoint');
      setPointInProgress(false);
    } else if (attackResult === 'F') {
      setCurrentAction('endPoint');
      setPointInProgress(false);
    } else if (attackResult === 'B' || attackResult === 'D') {
      setCurrentAction('afterNet');
    }
  };

  const handleBlock = () => {
    const { playerNumber, blockResult } = formData;
    const player = isOpponentSide ? 'XX' : playerNumber;
    if ((!isOpponentSide && !player) || !blockResult) {
      alert('Veuillez remplir tous les champs du bloc');
      return;
    }
    const code = `B${player.padStart(2, '0')}${blockResult}`;
    addToCode(code);
    
    if (blockResult === 'P') {
      setCurrentAction('endPoint');
      setPointInProgress(false);
    } else if (blockResult === 'F' || blockResult === 'O') {
      setCurrentAction('endPoint');
      setPointInProgress(false);
    } else if (blockResult === 'R') {
      setCurrentAction('afterBlock');
    } else if (blockResult === 'S') {
      setCurrentAction('afterNet');
    }
  };

  const handleRelance = () => {
    const { playerNumber, relanceQuality } = formData;
    const player = isOpponentSide ? 'XX' : playerNumber;
    if ((!isOpponentSide && !player) || !relanceQuality) {
      alert('Veuillez remplir tous les champs de la relance');
      return;
    }
    const code = `E${player.padStart(2, '0')}${relanceQuality}`;
    addToCode(code);
    
    if (relanceQuality === '-') {
      setCurrentAction('endPoint');
      setPointInProgress(false);
    } else {
      setCurrentAction('afterRelance');
    }
  };

  const handleDefense = () => {
    const { playerNumber, defenseQuality } = formData;
    const player = isOpponentSide ? 'XX' : playerNumber;
    if ((!isOpponentSide && !player) || !defenseQuality) {
      alert('Veuillez remplir tous les champs de la défense');
      return;
    }
    const code = `D${player.padStart(2, '0')}${defenseQuality}`;
    addToCode(code);
    
    if (defenseQuality === '-') {
      setCurrentAction('endPoint');
      setPointInProgress(false);
    } else {
      setCurrentAction('afterDefense');
    }
  };

  const handleUnknownPlayer = () => {
    setFormData({...formData, playerNumber: 'XX'});
  };

  const downloadTxt = () => {
    const blob = new Blob([matchCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `match_${matchConfig.homeTeam}_vs_${matchConfig.awayTeam}_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    if (confirm('Êtes-vous sûr de vouloir tout effacer ?')) {
      setStep('setup');
      setMatchCode('');
      setHistory([]);
      setCurrentAction('service');
      setPointInProgress(true);
      setHomeScore(0);
      setAwayScore(0);
      setCurrentSet(1);
      setSetsWon({ home: 0, away: 0 });
      resetForm();
    }
  };

  const renderSetupForm = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center text-indigo-700 mb-6">
            🏐 Configuration du Match
          </h1>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Équipe Domicile (DOM)
                </label>
                <input
                  type="text"
                  value={matchConfig.homeTeam}
                  onChange={(e) => setMatchConfig({...matchConfig, homeTeam: e.target.value})}
                  className="w-full p-3 border-2 border-indigo-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                  placeholder="Nom de l'équipe"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Équipe Extérieur (EXT)
                </label>
                <input
                  type="text"
                  value={matchConfig.awayTeam}
                  onChange={(e) => setMatchConfig({...matchConfig, awayTeam: e.target.value})}
                  className="w-full p-3 border-2 border-indigo-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                  placeholder="Nom de l'équipe"
                />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-blue-800 flex items-center gap-2">
                <Users size={20} /> Composition {matchConfig.homeTeam || 'Domicile'}
              </h3>
              <div className="grid grid-cols-3 gap-3 mb-3">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i}>
                    <label className="block text-xs mb-1 text-gray-600">
                      Position {i + 1}
                    </label>
                    <input
                      type="text"
                      maxLength="2"
                      value={matchConfig.homePlayers[i]}
                      onChange={(e) => {
                        const newPlayers = [...matchConfig.homePlayers];
                        newPlayers[i] = e.target.value;
                        setMatchConfig({...matchConfig, homePlayers: newPlayers});
                      }}
                      className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                      placeholder="N°"
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Position du passeur</label>
                <select
                  value={matchConfig.homeSetterPosition}
                  onChange={(e) => setMatchConfig({...matchConfig, homeSetterPosition: e.target.value})}
                  className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6].map(p => (
                    <option key={p} value={p}>Position {p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-red-800 flex items-center gap-2">
                <Users size={20} /> Composition {matchConfig.awayTeam || 'Extérieur'}
              </h3>
              <div className="grid grid-cols-3 gap-3 mb-3">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i}>
                    <label className="block text-xs mb-1 text-gray-600">
                      Position {i + 1}
                    </label>
                    <input
                      type="text"
                      maxLength="2"
                      value={matchConfig.awayPlayers[i]}
                      onChange={(e) => {
                        const newPlayers = [...matchConfig.awayPlayers];
                        newPlayers[i] = e.target.value;
                        setMatchConfig({...matchConfig, awayPlayers: newPlayers});
                      }}
                      className="w-full p-2 border rounded focus:border-red-500 focus:outline-none"
                      placeholder="N°"
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Position du passeur</label>
                <select
                  value={matchConfig.awaySetterPosition}
                  onChange={(e) => setMatchConfig({...matchConfig, awaySetterPosition: e.target.value})}
                  className="w-full p-2 border rounded focus:border-red-500 focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6].map(p => (
                    <option key={p} value={p}>Position {p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Quelle équipe sert en premier ?</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setMatchConfig({...matchConfig, serviceTeam: 'home'})}
                  className={`p-3 rounded-lg border-2 font-semibold transition ${
                    matchConfig.serviceTeam === 'home'
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white border-gray-300 hover:border-blue-500'
                  }`}
                >
                  {matchConfig.homeTeam || 'Domicile'}
                </button>
                <button
                  onClick={() => setMatchConfig({...matchConfig, serviceTeam: 'away'})}
                  className={`p-3 rounded-lg border-2 font-semibold transition ${
                    matchConfig.serviceTeam === 'away'
                      ? 'bg-red-500 text-white border-red-500'
                      : 'bg-white border-gray-300 hover:border-red-500'
                  }`}
                >
                  {matchConfig.awayTeam || 'Extérieur'}
                </button>
              </div>
            </div>

            <button
              onClick={startMatch}
              className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white p-4 rounded-lg font-bold text-lg hover:from-indigo-600 hover:to-blue-600 transition shadow-lg"
            >
              Commencer le match 🏐
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderServiceForm = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-blue-700">Service</h3>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium">Numéro du joueur</label>
              <button
                onClick={handleUnknownPlayer}
                className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
              >
                Adversaire (XX)
              </button>
            </div>
            {isOpponentSide ? (
              <div className="w-full p-2 border rounded bg-gray-50 text-gray-600">XX</div>
            ) : (
              <input
                type="text"
                maxLength="2"
                value={formData.playerNumber}
                onChange={(e) => setFormData({...formData, playerNumber: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="Ex: 5"
              />
            )}
          </div>
      <div>
        <label className="block text-sm font-medium mb-1">Type de service</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setFormData({...formData, serviceType: 'S'})}
            className={`p-2 border rounded ${formData.serviceType === 'S' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          >
            S - Smashé
          </button>
          <button
            onClick={() => setFormData({...formData, serviceType: 'F'})}
            className={`p-2 border rounded ${formData.serviceType === 'F' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          >
            F - Flottant
          </button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Zone du service</label>
        <div className="grid grid-cols-4 gap-2">
          {['1', '2', '3', '4', '5', '6', 'F', 'O'].map((zone) => (
            <button
              key={zone}
              onClick={() => setFormData({...formData, serviceZone: zone})}
              className={`p-2 border rounded ${formData.serviceZone === zone ? 'bg-blue-500 text-white' : 'bg-white'}`}
            >
              {zone === 'F' ? 'Filet' : zone === 'O' ? 'Out' : zone}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={handleService}
        className="w-full bg-green-500 text-white p-3 rounded font-semibold hover:bg-green-600"
      >
        Valider le service
      </button>
    </div>
  );

  const renderReceptionForm = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-blue-700">Réception</h3>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium">Numéro du joueur</label>
              <button
                onClick={handleUnknownPlayer}
                className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
              >
                Adversaire (XX)
              </button>
            </div>
            {isOpponentSide ? (
              <div className="w-full p-2 border rounded bg-gray-50 text-gray-600">XX</div>
            ) : (
              <input
                type="text"
                maxLength="2"
                value={formData.playerNumber}
                onChange={(e) => setFormData({...formData, playerNumber: e.target.value})}
                className="w-full p-2 border rounded"
              />
            )}
          </div>
      <div>
        <label className="block text-sm font-medium mb-1">Qualité de la réception</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: '*', label: '* - Parfaite' },
            { value: '+', label: '+ - Positive' },
            { value: 'O', label: 'O - Jouable' },
            { value: '-', label: '- - Injouable' }
          ].map((q) => (
            <button
              key={q.value}
              onClick={() => setFormData({...formData, receptionQuality: q.value})}
              className={`p-2 border rounded ${formData.receptionQuality === q.value ? 'bg-blue-500 text-white' : 'bg-white'}`}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={handleReception}
        className="w-full bg-green-500 text-white p-3 rounded font-semibold hover:bg-green-600"
      >
        Valider la réception
      </button>
    </div>
  );

  const renderPassForm = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-blue-700">Passe</h3>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium">Numéro du joueur</label>
              <button
                onClick={handleUnknownPlayer}
                className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
              >
                Adversaire (XX)
              </button>
            </div>
            {isOpponentSide ? (
              <div className="w-full p-2 border rounded bg-gray-50 text-gray-600">XX</div>
            ) : (
              <input
                type="text"
                maxLength="2"
                value={formData.playerNumber}
                onChange={(e) => setFormData({...formData, playerNumber: e.target.value})}
                className="w-full p-2 border rounded"
              />
            )}
          </div>
      <div>
        <label className="block text-sm font-medium mb-1">Type de passe</label>
        <div className="grid grid-cols-5 gap-2">
          {['2', '4', '6', '1', 'C', 'D', 'F', 'A', '?'].map((type) => (
            <button
              key={type}
              onClick={() => setFormData({...formData, passType: type})}
              className={`p-2 border rounded text-sm ${formData.passType === type ? 'bg-blue-500 text-white' : 'bg-white'}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Qualité de la passe</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: '*', label: '* - Parfaite' },
            { value: '+', label: '+ - Propre' },
            { value: 'O', label: 'O - Difficile' },
            { value: '-', label: '- - Inattaquable' }
          ].map((q) => (
            <button
              key={q.value}
              onClick={() => setFormData({...formData, passQuality: q.value})}
              className={`p-2 border rounded ${formData.passQuality === q.value ? 'bg-blue-500 text-white' : 'bg-white'}`}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Type de bloc</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: '0', label: '0 - Aucun' },
            { value: '1', label: '1 - Un' },
            { value: '2', label: '2 - Deux' },
            { value: '3', label: '3 - Trois' },
            { value: '4', label: '4 - Un mal placé' }
          ].map((b) => (
            <button
              key={b.value}
              onClick={() => setFormData({...formData, blockType: b.value})}
              className={`p-2 border rounded text-xs ${formData.blockType === b.value ? 'bg-blue-500 text-white' : 'bg-white'}`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={handlePass}
        className="w-full bg-green-500 text-white p-3 rounded font-semibold hover:bg-green-600"
      >
        Valider la passe
      </button>
    </div>
  );

  const renderAttackForm = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-blue-700">Attaque</h3>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium">Numéro du joueur</label>
              <button
                onClick={handleUnknownPlayer}
                className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
              >
                Adversaire (XX)
              </button>
            </div>
            {isOpponentSide ? (
              <div className="w-full p-2 border rounded bg-gray-50 text-gray-600">XX</div>
            ) : (
              <input
                type="text"
                maxLength="2"
                value={formData.playerNumber}
                onChange={(e) => setFormData({...formData, playerNumber: e.target.value})}
                className="w-full p-2 border rounded"
              />
            )}
          </div>
      <div>
        <label className="block text-sm font-medium mb-1">Type d'attaque</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'A', label: 'A - Attaque' },
            { value: 'R', label: 'R - Roulette' },
            { value: 'F', label: 'F - Feinte' },
            { value: 'N', label: 'N - Non attaquable' }
          ].map((t) => (
            <button
              key={t.value}
              onClick={() => setFormData({...formData, attackType: t.value})}
              className={`p-2 border rounded ${formData.attackType === t.value ? 'bg-blue-500 text-white' : 'bg-white'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Direction</label>
        <div className="grid grid-cols-4 gap-2">
          {['0', '1', '2', '3', '4', '5', '6'].map((dir) => (
            <button
              key={dir}
              onClick={() => setFormData({...formData, attackDirection: dir})}
              className={`p-2 border rounded ${formData.attackDirection === dir ? 'bg-blue-500 text-white' : 'bg-white'}`}
            >
              {dir}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Résultat</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'P', label: 'P - Point' },
            { value: 'D', label: 'D - Défense jouable' },
            { value: 'B', label: 'B - Touché bloc' },
            { value: 'F', label: 'F - Faute' }
          ].map((r) => (
            <button
              key={r.value}
              onClick={() => setFormData({...formData, attackResult: r.value})}
              className={`p-2 border rounded ${formData.attackResult === r.value ? 'bg-blue-500 text-white' : 'bg-white'}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={handleAttack}
        className="w-full bg-green-500 text-white p-3 rounded font-semibold hover:bg-green-600"
      >
        Valider l'attaque
      </button>
    </div>
  );

  const renderBlockForm = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-blue-700">Bloc</h3>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium">Numéro du joueur</label>
              <button
                onClick={handleUnknownPlayer}
                className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
              >
                Adversaire (XX)
              </button>
            </div>
            {isOpponentSide ? (
              <div className="w-full p-2 border rounded bg-gray-50 text-gray-600">XX</div>
            ) : (
              <input
                type="text"
                maxLength="2"
                value={formData.playerNumber}
                onChange={(e) => setFormData({...formData, playerNumber: e.target.value})}
                className="w-full p-2 border rounded"
              />
            )}
          </div>
      <div>
        <label className="block text-sm font-medium mb-1">Type de bloc</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'P', label: 'P - Point' },
            { value: 'R', label: 'R - Ralenti' },
            { value: 'O', label: 'O - Out' },
            { value: 'S', label: 'S - Soutenu' },
            { value: 'F', label: 'F - Faute' }
          ].map((b) => (
            <button
              key={b.value}
              onClick={() => setFormData({...formData, blockResult: b.value})}
              className={`p-2 border rounded ${formData.blockResult === b.value ? 'bg-blue-500 text-white' : 'bg-white'}`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={handleBlock}
        className="w-full bg-green-500 text-white p-3 rounded font-semibold hover:bg-green-600"
      >
        Valider le bloc
      </button>
    </div>
  );

  const renderRelanceForm = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-blue-700">Relance</h3>
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium">Numéro du joueur</label>
          <button
            onClick={handleUnknownPlayer}
            className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
          >
            Adversaire (XX)
          </button>
        </div>
        <input
          type="text"
          maxLength="2"
          value={formData.playerNumber}
          onChange={(e) => setFormData({...formData, playerNumber: e.target.value})}
          className="w-full p-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Qualité de la relance</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: '*', label: '* - Parfaite' },
            { value: '+', label: '+ - Positive' },
            { value: 'O', label: 'O - Jouable' },
            { value: '-', label: '- - Injouable' }
          ].map((q) => (
            <button
              key={q.value}
              onClick={() => setFormData({...formData, relanceQuality: q.value})}
              className={`p-2 border rounded ${formData.relanceQuality === q.value ? 'bg-blue-500 text-white' : 'bg-white'}`}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={handleRelance}
        className="w-full bg-green-500 text-white p-3 rounded font-semibold hover:bg-green-600"
      >
        Valider la relance
      </button>
    </div>
  );

  const renderDefenseForm = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-blue-700">Défense</h3>
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium">Numéro du joueur</label>
          <button
            onClick={handleUnknownPlayer}
            className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
          >
            Adversaire (XX)
          </button>
        </div>
        <input
          type="text"
          maxLength="2"
          value={formData.playerNumber}
          onChange={(e) => setFormData({...formData, playerNumber: e.target.value})}
          className="w-full p-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Qualité de la défense</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: '*', label: '* - Parfaite' },
            { value: '+', label: '+ - Sauvée' },
            { value: '-', label: '- - Autre côté' }
          ].map((q) => (
            <button
              key={q.value}
              onClick={() => setFormData({...formData, defenseQuality: q.value})}
              className={`p-2 border rounded ${formData.defenseQuality === q.value ? 'bg-blue-500 text-white' : 'bg-white'}`}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={handleDefense}
        className="w-full bg-green-500 text-white p-3 rounded font-semibold hover:bg-green-600"
      >
        Valider la défense
      </button>
    </div>
  );

  const renderActionSelector = () => {
    const actions = {
      'afterNet': ['Réception', 'Relance', 'Défense', 'Attaque', 'Bloc'],
      'afterReception': ['Passe', 'Attaque'],
      'afterRelance': ['Passe', 'Attaque'],
      'afterDefense': ['Passe', 'Attaque'],
      'attack': ['Attaque'],
      'afterBlock': ['Réception', 'Défense', 'Relance', 'Attaque']
    };

    const currentActions = actions[currentAction] || [];

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-blue-700">Que s'est-il passé ensuite ?</h3>
        <div className="grid grid-cols-2 gap-2">
          {currentActions.map((action) => (
            <button
              key={action}
              onClick={() => {
                if (action === 'Réception') setCurrentAction('reception');
                else if (action === 'Passe') setCurrentAction('pass');
                else if (action === 'Attaque') setCurrentAction('attack');
                else if (action === 'Relance') setCurrentAction('relance');
                else if (action === 'Défense') setCurrentAction('defense');
                else if (action === 'Bloc') setCurrentAction('block');
              }}
              className="p-3 bg-blue-500 text-white rounded font-semibold hover:bg-blue-600"
            >
              {action}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderEndPoint = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-blue-700">Fin du point</h3>
      <p className="text-gray-600">Qui a gagné ce point ?</p>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => endPoint('home')}
          className="p-4 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600"
        >
          {matchConfig.homeTeam} (##)
        </button>
        <button
          onClick={() => endPoint('away')}
          className="p-4 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600"
        >
          {matchConfig.awayTeam} (#)
        </button>
      </div>
    </div>
  );

  const renderMatchInterface = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <h1 className="text-3xl font-bold text-center text-indigo-700 mb-2">
            🏐 {matchConfig.homeTeam} vs {matchConfig.awayTeam}
          </h1>
          
          <div className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-lg p-4 mb-4">
            <div className="text-center mb-2">
              <span className="text-sm font-semibold">SET {currentSet}</span>
            </div>
            <div className="flex justify-around items-center">
              <div className="text-center">
                <div className="text-sm mb-1">{matchConfig.homeTeam}</div>
                <div className="text-4xl font-bold">{homeScore}</div>
                <div className="text-xs mt-1">Sets: {setsWon.home}</div>
              </div>
              <div className="text-3xl">-</div>
              <div className="text-center">
                <div className="text-sm mb-1">{matchConfig.awayTeam}</div>
                <div className="text-4xl font-bold">{awayScore}</div>
                <div className="text-xs mt-1">Sets: {setsWon.away}</div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 mb-4 flex-wrap items-center">
            <button
              onClick={() => {
                // revenir à l'étape précédente de l'UI si possible sinon annuler le code
                if (history.length > 0) {
                  undo();
                } else if (currentAction !== 'service') {
                  setCurrentAction('service');
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Retour
            </button>
            <button
              onClick={undo}
              disabled={history.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded disabled:opacity-50 hover:bg-gray-600"
            >
              <Undo size={16} /> Annuler
            </button>
            <button
              onClick={() => addTimeout('home')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              TM {matchConfig.homeTeam}
            </button>
            <button
              onClick={() => addTimeout('away')}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              TM {matchConfig.awayTeam}
            </button>
            <button
              onClick={clearAll}
              className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800"
            >
              <Trash2 size={16} /> Effacer
            </button>
            <button
              onClick={downloadTxt}
              disabled={!matchCode}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded disabled:opacity-50 hover:bg-indigo-600 ml-auto"
            >
              <Download size={16} /> Télécharger
            </button>
          <button
            onClick={() => endPoint('home')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Point DOM (##)
          </button>
          <button
            onClick={() => endPoint('away')}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Point EXT (#)
          </button>
            <button
              onClick={() => setShowPointPicker(!showPointPicker)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Point
            </button>
            <label className="flex items-center gap-2 ml-2 text-sm">
              <input
                type="checkbox"
                checked={isOpponentSide}
                onChange={(e) => setIsOpponentSide(e.target.checked)}
              />
              Côté adversaire (remplacer numéro par XX)
            </label>
          </div>
          {showPointPicker && (
            <div className="mb-4 flex gap-3">
              <button
                onClick={() => {
                  endPoint('home');
                  setShowPointPicker(false);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Domicile (##)
              </button>
              <button
                onClick={() => {
                  endPoint('away');
                  setShowPointPicker(false);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Extérieur (#)
              </button>
              <button
                onClick={() => setShowPointPicker(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Annuler
              </button>
            </div>
          )}

          <div className="bg-gray-100 p-4 rounded">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">Aperçu du code :</h3>
              <span className="text-sm text-gray-600">
                {matchCode.split('\n').filter(l => l.trim() && !l.includes('Match') && !l.includes('Set') && !l.includes('SERVICE') && !l.includes('DOM_P') && !l.includes('EXT_P') && !l.includes('######')).length} actions
              </span>
            </div>
            <pre className="bg-white p-3 rounded border overflow-x-auto text-sm max-h-40 font-mono">
              {matchCode || 'Encodage en cours...'}
            </pre>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          {pointInProgress && (
            <button
              onClick={addNetPass}
              className="w-full mb-4 p-3 bg-yellow-500 text-white rounded font-semibold hover:bg-yellow-600 flex items-center justify-center gap-2"
            >
              <Play size={16} /> Passage de filet (//)
            </button>
          )}

          {currentAction === 'service' && renderServiceForm()}
          {currentAction === 'reception' && renderReceptionForm()}
          {currentAction === 'pass' && renderPassForm()}
          {currentAction === 'attack' && renderAttackForm()}
          {currentAction === 'block' && renderBlockForm()}
          {currentAction === 'relance' && renderRelanceForm()}
          {currentAction === 'defense' && renderDefenseForm()}
          {['afterNet', 'afterReception', 'afterRelance', 'afterDefense', 'afterBlock'].includes(currentAction) && renderActionSelector()}
          {currentAction === 'endPoint' && renderEndPoint()}
        </div>
      </div>
    </div>
  );

  if (step === 'setup') {
    return renderSetupForm();
  }

  return renderMatchInterface();
};

export default VolleyballMatchEncoder;