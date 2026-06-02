package pt.ipca.scriptumai.data.local

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow

object AuthEventBus {
    private val _unauthenticated = MutableSharedFlow<Unit>(extraBufferCapacity = 1)
    val unauthenticated: SharedFlow<Unit> = _unauthenticated.asSharedFlow()

    fun emitUnauthenticated() {
        _unauthenticated.tryEmit(Unit)
    }
}
